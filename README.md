# FlowManager

[![Static Badge](https://img.shields.io/badge/Docs-github.io-blue)](https://martimy.github.io/flowmanager)


The FlowManager is a RYU controller application that gives the user manual control over the flow tables in an OpenFlow network. The user can create, modify, or delete flows directly from the application. The user can also monitor the OpenFlow switches and view statistics. The FlowManager is ideal for learning OpenFlow in a lab environment, or in conjunction with other applications to tweak the behaviour of network flows in a test environment. 

## Features

- Add/modify/delete flow entries in flow tables.
- Add/modify/delete group tables and meters.
- Backup/restore switch tables to/from local drive.
- View flow tables, group tables, and meters.
- View switch statistics.
- View network topology.
- Track flow entries.

![SCREEN1](web/img/screen1.png) ![SCREEN2](web/img/screen2.png)
![SCREEN3](web/img/screen3.png) ![SCREEN4](web/img/screen4.png)

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

### Ryu Controller

FlowManager is a [RYU Controller](https://osrg.github.io/ryu/) application, so make sure that the controller is installed properly before you proceed.
Also, if you intend to use FlowManager with [Mininet](http://mininet.org/), you will need to install that too.

To install Ryu, 

```
$ pip install ryu
```

Note: The application, ryu-manager, which you will need to run the FlowManager is known to have issues with Python3.10 and eventlet module. In this case, you may need to downgrade the Python version and the eventlet module.

If the default Python version in your machine is higher than 3.9, you may need install Python v3.9 and change the default Python version running on you machine or install Ryu in a virtual environment for Python 3.9:

1. Install Python 3.9

    ```bash
    $ sudo add-apt-repository ppa:deadsnakes/ppa
    $ sudo apt-get update
    $ sudo apt-get install python3.9
    ```

2. Install distutils

    ```bash
    $ sudo apt-get install python3.9-distutils
    ```

3. Create Virtual Environemnt (or change the default Python version)

    ```bash
    $ virtualenv -p /usr/bin/python3.9 venv39
    ```

4. Install Ryu

    ```bash
    $ source venv39/bin/activate
    $ python -m pip install --upgrade pip
    $ pip3 uninstall eventlet
    $ pip3 install eventlet==0.30.2
    $ pip3 install ryu
    ```

5. Verify the ryu-manager is working properly

    ```bash
    $ ryu-manager --version
    ryu-manager 4.34
    ```


### FlowManager

Install FlowManager using the following steps:

```
$ git clone https://github.com/martimy/flowmanager
```

## Running the app

Run the FlowManager alone:
```
$ ryu-manager ~/flowmanager/flowmanager.py
```

or with another RYU application:

```
$ ryu-manager ~/flowmanager/flowmanager.py ryu.app.simple_switch_13
```

and to display the topology:

```
$ ryu-manager --observe-links ~/flowmanager/flowmanager.py ryu.app.simple_switch_13
```

Use a web broswer to launch the site http://localhost:8080/home/index.html

### Docker installation

Use a [Docker image](https://hub.docker.com/r/martimy/ryu-flowmanager) to run Ryu Controller with the FlowManager.

```
docker pull martimy/ryu-flowmanager
docker run -d -p 6633:6633 -p 8080:8080 martimy/ryu-flowmanager
```

To run the controller with another Ryu app:

```
docker run -d -p 6633:6633 -p 8080:8080 martimy/ryu-flowmanager:latest ryu.app.simple_switch_13
docker run -d -p 6633:6633 -p 8080:8080 martimy/ryu-flowmanager:latest flowmanager/flowmanager.py ryu.app.simple_switch_13
```

To bypass the entry point:

```
docker run -it --entrypoint bash martimy/ryu-flowmanager
```

## Documentation

You can find some useful documention in [here](https://martimy.github.io/flowmanager/), but it is still a work-in-progress.


## Built With

* [Python](https://www.python.org/) - A programming language ideal for SDN applications.
* [jQuery](https://jquery.com/) - A JavaScript library for event handling, animation.
* [D3.js](https://d3js.org/) - A JavaScript library for data visulization. 

## Authors

* **Maen Artimy** - [Profile](http://adhocnode.com)

## License

FlowManager is licensed under the Apache 2 License - see the [LICENSE](LICENSE) file for details

