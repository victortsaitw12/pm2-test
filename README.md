# pm2-test
1. Goal - Build an API which could update the code without stopping service.
2. Idea - Make a cluster of processes when initializing the service. After the new code committed or updated, we could send a packet to let the service restart the processes which could reload the new code and release the memory.
