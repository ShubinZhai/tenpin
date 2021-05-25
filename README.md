# tenpin
tenpin scoring

start zookeeper: /usr/local/Cellar/kafka/2.8.0/bin/zookeeper-server-start /usr/local/etc/kafka/zookeeper.properties &
start kafka: /usr/local/Cellar/kafka/2.8.0/bin/kafka-server-start /usr/local/etc/kafka/server.properties &

start redis: brew services restart redis
redis-commander


