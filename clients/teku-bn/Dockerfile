ARG branch=develop

FROM consensys/teku:$branch

ADD teku_bn.sh /teku_bn.sh
USER root
RUN chmod +x /teku_bn.sh
RUN mkdir /data && chown teku /data

# TODO: output accurate client version
RUN echo "latest" > /version.txt

USER teku
ENTRYPOINT ["/teku_bn.sh"]
