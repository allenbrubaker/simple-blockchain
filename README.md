# Challenge

Build a production-level real-time system that emulates the indexing of data on the blockchain. In this system, Solana account updates will stream continuously in real time. For this challenge, the data will be similar to Solana accounts, but no blockchain knowledge needed!

## System Details
In a production system, this would be connected to a blockchain node, and stream data updates continuously. For this challenge, account updates can be asynchronously read from a json file. Each account comes into the system at a continuous uniform (random) distribution between 0 and 1000ms.

Each account has the following information:
- ID - Unique identifier of the account
- AccountType - Type of the account.
- Data - Data of the account. All accounts that share the same AccountType have the same data schema. This is the information in which clients are most interested in. You can assume these schemas are fixed.
- Tokens - Amount of tokens in the account.
- Version - Version of the account on chain. If two updates for the same account come in, the old version should be erased.
- CallbackTimeMs - Time at which we’d like to print the contents of the account to console after it’s been ingested.

Display a short message log message to console when each (accountId + version) tuple has been indexed.

Display a callback log when an account’s call_back_time_ms has expired. If the same account is ingested with a newer version number, and the old callback has not fired yet, cancel the older version’s active callback. If an old version of the same account is ingested, ignore that update.

Display a message when an old callback is canceled in favor of a new one.
Once all events and callbacks have completed, print the highest token-value accounts by AccountType (taking into account write version), and gracefully shut-down the system.

# Setup Instructions

## Install

Run the following commands for installation:

- npm i -g yarn
- nvm use
- yarn install

## Test

All aspects of the code are thoroughly tested including the core business/challenge rules. Run using the below command:

- yarn test

## Execution

To execute the code, run the following command:

- yarn start

# Design Patterns

As one may quickly notice, I exclusively leveraged reactive programming techniques with RxJS and observables in order to manipulate and compose asynchronous streams of events. This allowed for very concise functional programming-like syntax with powerful asynchronous composition capabilities. This for instance allowed me to map the input array of accounts to a stream of accounts, inject a random delay from 0-1000 seconds into each stream element, index streams, and wait until all callbacks are completed in very few concise and succinct lines of code (refer to app.ts).

I also leveraged a library called _inverify_ in order to fully leverage dependency injection and reap the benefit of inversion of control (IoC) in order to decouple interfaces from the implementation. This invariably facilitates maintenance and testing of the code. Thus, you will notice all the code is organized into service interfaces and classes. This also allows for independent control of instantiation scope, including singleton or multitons/transient (see startup.ts). However, I strictly utilized singletons in order to facilitate testing and performance.

# Observability

If this were a production system, I would most assuredly leverage the common observability components including distributed tracing, metrics, and logs. I would most likely run this system as a lightweight and highly available AWS lambda sitting behind event bridge/SQS in order to optimize throughput and ingest massively concurrent streams of accounts asynchronously. I would thoroughly log the core actions and contexts of methods via the console which can then be inspected in cloud watch. Furthermore, I would wire the code up to sentry or rollbar for exception logging, tracking, and notifications. One could potentially watch the queue length and oldest message time of the associated SQS queue to gauge the health of the system. For monitoring one could also setup gauges to track requests per second (rps), number of accounts in the ledger, etc. and upload these to datadog to display in carefully crafted dashboards. Finally, I would set up alerts and rules with sane thresholds to notify if metrics such as error counts and rps deviate from norms. 

During a production rollout, I would first and foremost inspect the CloudWatch auto-generated dashboards to quickly inspect key metrics such as duration, errors, throttling, concurrent executions, message queue lengths including the dead letter queues, consumption rates, and approximate age of oldest message. I would monitor sentry for any exceptions and inspect the datadog dashboards to ensure requests per second and any other custom metrics are healthy. Moreover, I would monitor the resource usage of the lambda to ensure adequate CPU and memory limits are in place and adjust as necessary.
