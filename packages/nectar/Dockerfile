# Use an official Ubuntu base image
FROM ubuntu:22.04

# Avoid prompts from apt
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    git \
    build-essential \
    ca-certificates \
    gnupg \
    software-properties-common \
    # PDF processing dependencies
    poppler-utils \
    # Office document processing dependencies
    libreoffice \
    # Image processing and OCR dependencies
    tesseract-ocr \
    libtesseract-dev \
    tesseract-ocr-eng \
    python3-pil \
    # Audio transcription dependencies
    ffmpeg \
    # Additional text processing dependencies
    unzip \
    # Python and pip
    python3 \
    python3-pip

# Install uv using pip
RUN pip install uv

# Install Go
RUN wget https://go.dev/dl/go1.21.5.linux-amd64.tar.gz && \
    tar -C /usr/local -xzf go1.21.5.linux-amd64.tar.gz && \
    rm go1.21.5.linux-amd64.tar.gz

# Set up Go environment variables
ENV PATH="/usr/local/go/bin:${PATH}"
ENV GOPATH="/go"
ENV PATH="${GOPATH}/bin:${PATH}"

# Create a working directory
WORKDIR /app

# Create and activate virtual environment with uv
RUN uv venv
ENV PATH="/app/.venv/bin:$PATH"

# Install markitdown using uv
RUN uv pip install markitdown

# Install Go deps
COPY go.mod go.sum /app/
RUN go mod download

# Compile Go code
COPY . /app

# Build the Go code
RUN go build -o /app/nectar *.go

# Default command (can be overridden)
CMD ["/app/nectar"]
