stomp-copy
================================================================================

A small program to read from a STOMP queue and write the messages to a CouchDB
database.


to run locally
--------------------------------------------------------------------------------

    node index.js <host> <queue>

where `host` is the hostname of the STOMP server, and `queue` is the name of
the queue to read from.

You will need to be running a version of [CouchDB](http://couchdb.apache.org/)
locally if you want to save the records when run locally.


to run on Bluemix / Cloud Foundry
--------------------------------------------------------------------------------

Create a user-provided service with the following command:

    cf cups stomp -p "host,queue"

You will be prompted for the host and queue values for the STOMP queue.

Create a Cloudant Database with the command:

    cf create-service cloudantNoSQLDB Shared stomp-db

Copy the file `manifest-sample.yml` to the file `manifest.yml`and change the
`host` property to a hostname unique across your Cloud Foundry instance.

Finally, push the application

    cf push
