﻿/**************************************************************************************************************/

/* App Class
 * 
 * The app class is the main entity to which the 
 * single-page-app is bound. It is a view-model
 * maintaining the test-suites to view and the
 * filter/sorting toggles.
 */
//app constructor function
function app() {
    var self = this;
    self.errorState = ko.observable(false);
    self.errorMessage = ko.observable("");
    self.testSuites = ko.observableArray([]);
   
    self.showPasses = ko.observable(true);
    self.showFails = ko.observable(true);
    self.sortDateAsc = ko.observable(true);
    self.sortedFilteredSuites = ko.computed(function () {
        var a = -1;
        var b = 1;
        if (!self.sortDateAsc()) {
            a = 1;
            b = -1;
        }
        var res = self.testSuites().sort(function (l, r) {
            return l.started() == r.started() ? 0
                : l.started() < r.started() ? a
                    : b;
        }).filter(function (t) {
            
            return (t.pass() && self.showPasses())||(!t.pass() && self.showFails());
            }
        );
        return res;
    });
    self.passFilter = ko.computed(function() {
        if (self.showPasses()) {
            return "Passes";
        } else {
            return "No passes";
        }
    });
    self.failFilter = ko.computed(function () {
        if (self.showFails()) {
            return "Fails";
        } else {
            return "No fails";
        }
    });
    self.sortMode = ko.computed(function () {
        if (self.sortDateAsc()) {
            return "Oldest";
        } else {
            return "Newest";
        }
    });
    self.clients = ko.computed(function () {
        var clientList= self.testSuites().map(function (t) {
            return t.primaryClient();
        });

        var uniqueClientList = $.grep(clientList, function (v, k) {
            return $.inArray(v, clientList) === k;
        });

        return uniqueClientList;

    });
}

app.prototype.ToggleFilterPasses = function () {
    var self = this;
    self.showPasses(!self.showPasses());
}

app.prototype.ToggleFilterFailures = function () {
    var self = this;
    self.showFails(!self.showFails());
}

app.prototype.ToggleDateSort = function () {
    var self = this;
    self.sortDateAsc(!self.sortDateAsc());
 }


app.prototype.LoadTestSuites = function(path, file) {
    var self = this;
    $.ajax({
        url: path+"/"+file,
        data: null,
        success: function (allData) {
            var lines = allData.split("\n").filter(function (line) { return line.length > 0; });
            var testSuiteSummaries = $.map(lines, function (item)
            {
                var summary = new testSuiteSummary(JSON.parse(item));
                summary.path = path;
                return summary;
            });
            self.testSuites(testSuiteSummaries);
        },
        dataType: "text"
    }
    ).
    fail(function (e) {
        alert("error");
    });
}

/**************************************************************************************************************/

/* TestSuiteSummary Class
 *
 * A test suite summary contains metadata
 * about a test suite execution, including
 * for example if the test suite passed
 * and what its purpose is.
 */

// test suite summary ctor function
function testSuiteSummary(data) {
    self = this;
    self.path = "";
    self.fileName = ko.observable(data.fileName);
    self.name = ko.observable(data.name);
    self.started = ko.observable(Date.parse(data.start));
    self.primaryClient = ko.observable(data.primaryClient);
    self.pass = ko.observable(data.pass);
    self.passStyle = ko.computed(function () {
        return self.pass() ? "border-success" : "border-danger";
    });
    self.suiteLabel = ko.computed(function () { return "Suite" + self.fileName().slice(0,-5); })
    self.suiteDetailLabel = ko.computed(function () { return "CollapseSuite" + self.fileName().slice(0,-5); })
    self.testSuite = ko.observable();
    self.loading = ko.observable(false);
    self.loaded = ko.observable(false);
    self.loadingError = ko.observable(false);

}

testSuiteSummary.prototype.ShowSuite = function () {
    var suitePath = this.path + "/" + this.fileName();
    var self = this;
    if (!self.loaded()) {
        self.loading(true);
        self.loadingError(false);
        $.getJSON(
            suitePath,
            function (suiteData) {
                self.testSuite(new testSuite(suiteData));
                self.loaded(true);
            }

        )
        .fail(function () {
            self.loadingError(true);
        })
        .always(function () {
            self.loading(false);
        })
        ;
    }
    return true;

}
/**************************************************************************************************************/

/* testClientResult Class
 *
 * This describes a specific test result in a test case
 * for a specific client type
 */

// testClientResult ctor
function testClientResult(pass,details,name,version,instantiated,log) {
    this.pass = ko.observable(pass);
    this.details = ko.observable(details);
    this.clientName = ko.observable(name);
    this.clientVersion = ko.observable(version);
    this.clientInstantiated = ko.observable(instantiated);
    this.logfile = ko.observable(log);
}
/**************************************************************************************************************/

/* testResult Class
 *
 *  A test result, including if it passed
 *  and some descriptive information
 */

// test case result ctor
function testResult(data) {
    var self = this;
    this.pass = ko.observable(data.pass);
    this.details = ko.observable(data.details);
    this.passLabel = ko.computed(function () {
        return self.pass() ? "pass" : "fail";
    });

}
/**************************************************************************************************************/


/* testCase Class
 *
 *  A test case, which could involve
 *  one or more clients, with name and
 *  description of the intended purpose,
 *  an overall test result and list of
 *  per client results.
 */

// testCase ctor
function testCase(data) {
    var self = this;
    this.id = ko.observable(data.id);
    this.name = ko.observable(data.name);
    this.description = ko.observable(data.description);
    this.start = ko.observable(Date.parse(data.start));
    this.end = ko.observable(Date.parse(data.end));
    this.summaryResult = ko.observable(new testResult(data.summaryResult));
    this.clientResults = ko.observableArray(makeClientResults(data.clientResults, data.clientInfo));
    var dur = moment.duration(moment(self.end()).diff(moment(self.start())));
    self.duration = ko.observable(calcFineDuration(dur));
    self.passTextStyle = ko.computed(function () {
        return self.summaryResult().pass() ? "text-success" : "text-danger";
    });
    
}

function makeClientResults(clientResults, clientInfos) {
    $.map(clientResults, function (clientName, testResult) {
        var pass = testResult.pass;
        var details = testResult.details;
        var name = "Missing client info.";
        var version = "";
        var instantiated;
        var log = "";
        if (clientInfos.hasOwnProperty(clientName)) {
            var clientInfo = clientInfos[clientName];
            name = clientInfo.name;
            version = clientInfo.versionInfo;
            instantiated = clientInfo.instantiatedAt;
            log = clientInfo.logFile;
        }
        return new testClientResult(pass, details, name, version, instantiated, log);
    });
}

function calcDuration(duration) {
    var ret = ""
    if (duration.hours() > 0) { ret = ret + duration.hours() + "hr "; }
    if (duration.minutes() > 0) { ret = ret + duration.minutes() + "min "; }
    ret = ret + duration.seconds() + "s "; 
    return ret;
}

function calcFineDuration(duration) {
    var ret = ""
    var hours = 0;
    
    if (duration.minutes() > 0 || duration.hours()>0) { ret = ret + duration.minutes()+(durations.hours()*60) + "min "; }
    ret = ret + duration.seconds() + "s ";
    ret = ret + duration.milliseconds() + "ms ";
    
    return ret;
}
/**************************************************************************************************************/


/* testSuite Class
 *
 *  A test suite, with name and description,
 *  covers a specific functional area, such
 *  as p2p discovery, consensus etc. It is 
 *  a single execution and contains a list of 
 *  testCase results.
 */
function testSuite(data) {
    var self = this;
    self.id = ko.observable(data.id);
   
    self.name = ko.observable(data.name);
    self.description = ko.observable(data.description);
    var testCases = $.map(data.testCases, function (item) { return new testCase(item) });
    self.testCases = ko.observableArray(testCases)
    var earliest = Math.min.apply(Math, testCases.map(function (tc) { return tc.start(); }));
    var latest = Math.max.apply(Math, testCases.map(function (tc) { return tc.end(); }));
    var fails = testCases.map(function (tc) { if (!tc.summaryResult().pass()) return 1; else return 0; }).reduce(function (a, b) { return a + b; },0);
    var successes = testCases.map(function (tc) { if (tc.summaryResult().pass()) return 1; else return 0; }).reduce(function (a, b) { return a + b; }, 0);
    self.started = ko.observable(earliest);
    self.ended = ko.observable(latest);
    self.passes = ko.observable(successes);
    self.fails = ko.observable(fails);
    var dur= moment.duration(  moment(self.ended()).diff(moment(self.started())));
    self.duration = ko.observable(calcDuration(dur));
    self.showStateFlag = ko.observable(false);
    self.showState = ko.computed(function () {
        return self.showStateFlag() ? "Hide" : "Show";
    });
}

testSuite.prototype.ToggleTestCases = function () {
    var self = this;
    self.showStateFlag(!self.showStateFlag());
}

