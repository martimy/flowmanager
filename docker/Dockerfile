# OS-Ken controller + FlowManager
FROM python:3.10.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends git \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -m auser
WORKDIR /home/auser

RUN git clone https://github.com/martimy/flowmanager \
    && pip install --no-cache-dir -r flowmanager/requirements.txt \
    && chown -R auser:auser /home/auser/flowmanager

# Mount point for your own SDN apps
RUN mkdir /home/auser/app && chown auser:auser /home/auser/app

USER auser
WORKDIR /home/auser

EXPOSE 6633 6653 8080

ENTRYPOINT ["python3", "flowmanager/controller.py", "flowmanager/flowmanager.py"]
CMD []