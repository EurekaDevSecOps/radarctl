pipeline {
    agent {
        docker {
            image 'node:22'
            args '-v /var/run/docker.sock:/var/run/docker.sock'
        }
    }
    
    environment {
        EUREKA_AGENT_TOKEN = credentials('EUREKA_AGENT_TOKEN')
        EUREKA_PROFILE = credentials('EUREKA_PROFILE')
    }

stages {
    stage('Install Radar') {
        steps {
            echo 'Installing Radar CLI...'
            sh '''
                npm install -g @eurekadevsecops/radar
                radar --version
            '''
        }
    }
    
    stage('Verify Scanners') {
        steps {
            echo 'Checking available scanners...'
            sh 'radar scanners'
        }
    }
    
    stage('Run Scan') {
        steps {
            echo 'Running security scan...'
            sh 'radar scan -s opengrep'
        }
    }
}

post {
    success {
        echo 'Scan completed successfully! Check Eureka dashboard for results.'
    }
    failure {
        echo 'Scan failed. Check logs above.'
    }
}
}
