#!/home/book/.osken/bin/python3

import eventlet

eventlet.monkey_patch()

from os_ken.cmd import manager

manager.main()
