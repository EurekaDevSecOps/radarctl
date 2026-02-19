pipeline {
    agent any
    
    environment {
        EUREKA_AGENT_TOKEN = credentials('EUREKA_AGENT_TOKEN')
        EUREKA_PROFILE = credentials('EUREKA_PROFILE')
    }
    
    stages {
        stage('Install Radar') {
            steps {
                echo 'Installing Radar CLI...'
                sh '''
                    npm install @eurekadevsecops/radar
                '''
            }
        }
        
        stage('Verify Scanners') {
            steps {
                echo 'Checking available scanners...'
                sh 'npx radar scanners'
            }
        }
        
        stage('Run Scan') {
            steps {
                echo 'Running security scan...'
                sh 'npx radar scan -s opengrep'
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
