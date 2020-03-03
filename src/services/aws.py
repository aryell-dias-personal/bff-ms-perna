import boto3

def deleteMessage(ReceiptHandle, QueueUrl):
    sqsClient = boto3.client('sqs')
    sqsClient.delete_message(
        QueueUrl='string',
        ReceiptHandle='string'
    )
