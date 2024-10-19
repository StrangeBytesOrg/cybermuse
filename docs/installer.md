# Setup
nsis is required for building the windows installer. Running it in a docker container is easy enough.

```bash
docker run -it --rm -v ./installer:/installer ubuntu:24.04 bash

apt-get update && apt-get install -y nsis
cd /installer
makensis example.nsi
```
