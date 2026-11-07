# Usage

1. Create app folders 

  ```bash
  mkdir -p ~/flowmanager/examples
  ```

2. Copy your SDN apps into the examples folder

3. Start the FlowManager with an app

  ```bash
  cd ~/flowmanager
  docker run -d -p 6653:6653 -p 8080:8080 \
             -v ${PWD}/examples:/home/auser/app \
             --name fm martimy/flowmanager:v0.5 app/learning_switch_2.py
  ```


# Troubleshooting

## Checking the logs

  ```bash
  docker logs fm
  ```

## Is the app file visible inside the container?

  ```bash
  docker run --rm --entrypoint ls -v ${PWD}/examples:/home/auser/app martimy/flowmanager:v0.5 -l /home/auser/app
  ```


## Which directory does the container start in?


  ```bash
  docker run --rm --entrypoint pwd martimy/flowmanager:v0.5
  ```