# Use the official Python image as the base
FROM python:3.11.4-alpine3.18

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Create and set the working directory
WORKDIR /app

# Install dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy the Django project code into the container
COPY . /app/

# Set the environment variable
ARG DOCKER_ENV
ENV DOCKER_ENV=${DOCKER_ENV}

# Collect static files
RUN python manage.py collectstatic --noinput

# Expose the Django app port
EXPOSE 8000

# Command to run the gunicorn server
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "ethical_index.wsgi:application"]
