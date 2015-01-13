stomp-copy
================================================================================

A small program to read from a STOMP queue and write the messages to a CouchDB
database.


to run locally
--------------------------------------------------------------------------------

    node index.js <host> <queue>

where `host` is the hostname of the STOMP server, and `queue` is the name of
the queue to read from.


to run on Bluemix / Cloud Foundry
--------------------------------------------------------------------------------

Create a user-provided service with the following command:

    cf cups stomp -p "host,queue"

You will be prompted for the host and queue values for the STOMP queue.

Edit the `manifest-yml` and change the `host` property to a hostname unique
across your Cloud Foundry instance.

Finally, push the application

    cf push
