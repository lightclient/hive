ARG branch=develop

FROM consensys/teku:$branch

ADD teku.sh /teku.sh
USER root
RUN chmod +x /teku.sh
RUN mkdir /data && chown teku /data

# TODO: output accurate client version
RUN echo "latest" > /version.txt

USER teku
ENTRYPOINT ["/teku.sh"]
