# Ten-pin bowling
Tenpin scoring using Kafka and Redis

## Specs:
See traditional scoring logic per <a href="https://en.wikipedia.org/wiki/Ten-pin_bowling#Scoring">Wikepedia</a>.

Additional logic:
<ol>
<li>applying bonus points is hardest part and used counter to keep track state in current/non-refactored version</li>
<li>bonus is applied multiple times per "bonusballleft", but doesn't apply current frame</li>
<li>last frame(10th) requires check for "bonusballleft" before existing</li>
</ol>

## Design: 
### Code
1st version is brutal force without using advanced data structure and algo, but will refactor it.

Main logic is use of iscurrentframe flag to keep track if current frame is done, and bonusballleft counter
to keep track of how to apply points.

tpClient is used to generate the pin down events for each player (1 instance per player)

tenpinscoreboard is used to display scoring for all users

### Infra:
Using Kafka to store all player generated events for scoring

Using Redis to cache and store scores per player and current leader

## Monitoring
Kafka: Offset Explorer for Q mgmt
Redis: redis-commander for cache and game status tracking

##How to setup:

brew install Kafka 
brew install redis

To start Kafka:
start zookeeper: /usr/local/Cellar/kafka/2.8.0/bin/zookeeper-server-start /usr/local/etc/kafka/zookeeper.properties &
start kafka: /usr/local/Cellar/kafka/2.8.0/bin/kafka-server-start /usr/local/etc/kafka/server.properties &
start redis: brew services restart redis

npm install redis-commander
redis-commander

### Results
![img1](/imgs/img1.png)
![img2](/imgs/img2.png)
![img3](/imgs/img3.png)
![img4](/imgs/img4.png)


