# FlowManager

[![Static Badge](https://img.shields.io/badge/Docs-github.io-blue)](https://martimy.github.io/flowmanager)


The FlowManager is a software-defined networking (SDN) application that gives the user manual control over the flow tables in an OpenFlow network. The user can create, modify, or delete flows directly from the application. The user can also monitor the OpenFlow switches and view statistics. The FlowManager is ideal for learning OpenFlow in a lab environment, or in conjunction with other applications to tweak the behaviour of network flows in a test environment. 

The FlowManager was originally based on RYU controller. In its latest version (0.5.0), the application was migrated to [OS-Ken](https://github.com/osrg/os-ken) (a fork of RYU) for better maintenance and Python 3 compatibility

## Features

- Add/modify/delete flow entries in flow tables.
- Add/modify/delete group tables and meters.
- Backup/restore switch tables to/from local drive.
- View flow tables, group tables, and meters.
- View switch statistics.
- View network topology.
- Track flow entries.

[![Main Dashboard](docs/img/screen_dash.png)](docs/img/Screenshot_dash.png) [![Flow Tables](docs/img/screen_flows.png)](docs/img/Screenshot_flows.png) [![Flow Modification Form](docs/img/screen_ctrl.png)](docs/img/Screenshot_ctrl.png) [![Network Topology](docs/img/screen_topo.png)](docs/img/Screenshot_topo.png)

### New in V0.5.0

- Migrated from Ryu to OS-Ken.
- Replaced legacy WSGI/RPC stack with FastAPI.
- Introduced Pydantic models for robust API data validation and type safety.
- Refactored API to return structured JSON responses instead of raw strings.
- Replaced `post` with `ajax` in js code.
- Removed Python 2 compatibility layers.
- Migrated the UI form JQuery to Vue 2
- Updated colour scheme

### New in V0.4.2

- Upgraded jquery to v3.7.1

### New in V0.4.1

- Upgraded jquery to v3.5.0

### New in V0.4.0

- Fixed a bug tracking flow entries.
- Editing Python code style closer to PEP-8 (more work is needed).
- Spliting Python code into four modules for easier management.
- Reorganized folders. 

## Installation

Clone the FlowManager repository:

```bash
$ git clone https://github.com/martimy/flowmanager
cd flowmanager
```

Install the software requirements (preferably in Python virtual environment):

```bash
python3 -m venv .flwmgr
source ./flWmgr/bin/source
pip install -r requirements.txt
```

### Mininet

If you intend to use FlowManager with [Mininet](http://mininet.org/), you will need to install that too.


## Running the app

To avoid `eventlet` related issues (like the "RLock was not greened" error), use the provided `run_osken.py` script to launch the application:

Run the FlowManager alone:
```bash
$ python3 run_osken.py flowmanager.py
```

or with another SDN application:

```bash
$ python3 run_osken.py flowmanager.py \<application>\
```

and to display the topology:

```bash
$ python3 run_osken.py --observe-links flowmanager.py \<application\>
```

Use a web browser to launch the site `http://localhost:8080/home/index.html`

For legacy UI, use `http://localhost:8080/home/legacy/index.html`



## Documentation

You can find some useful documentation in [here](https://martimy.github.io/flowmanager/).


## Author

* Created by **Maen Artimy** - [Personal blog](http://adhocnode.com)

## License

FlowManager is licensed under the Apache 2 License - see the [LICENSE](LICENSE) file for details


