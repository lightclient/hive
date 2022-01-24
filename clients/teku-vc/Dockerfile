ARG branch=develop

FROM consensys/teku:$branch

ADD teku_vc.sh /teku_vc.sh
USER root
RUN chmod +x /teku_vc.sh
RUN mkdir /data && chown teku /data

# TODO: output accurate client version
RUN echo "latest" > /version.txt

USER teku

ENTRYPOINT ["/teku_vc.sh"]
