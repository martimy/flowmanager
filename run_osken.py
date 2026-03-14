import eventlet
eventlet.monkey_patch()

from os_ken.cmd import manager

manager.main()

