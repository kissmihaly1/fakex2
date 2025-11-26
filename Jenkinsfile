pipeline {
  agent any
  environment {
    DOCKER_BUILDKIT = "1"
  }
  stages {
    stage('Install') {
      steps {
        dir('server') {
          sh 'npm ci'
        }
      }
    }
    stage('Test') {
      steps {
        dir('server') {
          sh 'npm test'
        }
      }
    }
    stage('Build backend image') {
      steps {
        sh 'docker build -t fakex-backend:latest server'
      }
    }
    stage('Lint compose') {
      steps {
        sh 'docker compose config -q'
      }
    }
  }
  post {
    success {
      archiveArtifacts artifacts: 'server/npm-debug.log', allowEmptyArchive: true
    }
  }
}
