# !/usr/bin/python
# -*-coding:utf-8-*-

import json
import requests
import schedule
import time
import smtplib
import logging
from email.MIMEMultipart import MIMEMultipart
from email.MIMEText import MIMEText

file_object = open('config.json')
try:
    config = json.loads(file_object.read())
finally:
    file_object.close()

request_url = config['urls']
headers = {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Encoding': 'gzip, deflate, sdch',
    'Cache-Control': 'no-cache',
    'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.75 Safari/537.36'
}

sender = config['mailer']['auth']['user']
receiver_me = config['to_author']
receivers = config['to_all']

logger = logging.getLogger(__name__)
handler = logging.StreamHandler()
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s : %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)


def bootstrap():
    schedule.every(30).minutes.do(monitor)
    # schedule.every(60).seconds.do(monitor)
    while True:
        schedule.run_pending()
        time.sleep(1)


def monitor():
    logger.warning('---------- monitor begin ----------')
    error_text = ''
    for url in request_url:
        try:
            r = requests.get(url, timeout=30, headers=headers, verify=False)
        except requests.exceptions.RequestException, error:
            logger.warning(error)
            error_text += 'site: %s<br/> error: %s<br/> time: %s<br/><br/>' % (url, error, time.ctime())
            continue

        if r.status_code != 200 and r.status_code != 302:
            error_text += 'site: %s<br/> code: %s<br/> time: %s<br/><br/>' % (url, str(r.status_code), time.ctime())

    if error_text != '':
        send(error_text, receivers)
    else:
        logger.warning('No Error')
        send('Monitor no error from python', receiver_me)


def send(arg_send_text, arg_receiver):
    logger.warning('Ready to send email')
    msg = MIMEMultipart()
    msg['From'] = 'Jamais<%s>' % sender
    msg['To'] = ','.join(arg_receiver)
    msg['Subject'] = 'Web page monitor'
    msg.attach(MIMEText(arg_send_text, 'html'))
    smtp_obj = None
    try:
        smtp_obj = smtplib.SMTP_SSL(config['mailer']['host'], config['mailer']['port'])
        smtp_obj.login(config['mailer']['auth']['user'], config['mailer']['auth']['pass'])
        smtp_obj.sendmail(sender, arg_receiver, msg.as_string())
        smtp_obj.quit()
        logger.warning('Successfully sent email')
    except smtplib.SMTPException:
        logger.warning('Error: unable to send email')
        if smtp_obj is not None:
            smtp_obj.quit()


if __name__ == '__main__':
    logger.warning('run...')
    bootstrap()
