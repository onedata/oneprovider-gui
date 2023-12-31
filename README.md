About
=====

*oneprovider-gui* is GUI written in Ember distributed with OP worker.

Goals
-----

This repo allows to separate GUI from OZ worker repos, which improves
ease of maintenance and lowers build times.

It is able to build a release containing only compiled GUI static files
and create a static docker with those files.

Getting Started
---------------
Before building make sure submodules are initialized:
```
make submodules
```

To build a development release of GUI:

```
make             # run natively (requires npm, ember)
./make.py        # run in docker (onedata/gui_builder) that has all deps
```
<br />

To build a production release of GUI:

```
make rel         # run natively (requires npm, ember)
./make.py rel    # run in docker (onedata/gui_builder) that has all deps
```

<br />

Development
-----------

For development with one-env, please start oz-worker from sources, then build
this project to the source dir, eg.:

```
ember build --environment=development-backend --output-path=/Users/kliput/Onedata/env-develop-oz/op-worker-18.07/_build/default/rel/op_worker/data/gui_static --watch
```

and start rsync watcher in one-env:

```
./onenv watch krakow
```

Support
-------

For more information visit onedata.org
