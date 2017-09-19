# Global variables
_modulename = "test"
import logging
import json

# logging.basicConfig(filename="booking_logfile.log", filemode="w", format='%(asctime)s %(message)s', level=logging.INFO)
logging.basicConfig(format='%(asctime)s %(message)s', level=logging.INFO)

CLIENTS = [
            {'id': 1, 'name': 'TestName1', 'surname': 'TestSurname1'},
            {'id': 2, 'name': 'TestName2', 'surname': 'TestSurname2'},
            {'id': 3, 'name': 'TestName3', 'surname': 'TestSurname3'},
            {'id': 4, 'name': 'TestName4', 'surname': 'TestSurname4'}
          ]
# Class
class test():
    def __init__(self, parent):
        self._parent = parent

    def getClients(self, session, id=None):
        return CLIENTS

    def saveClient(self, session, model):
        client_found = False
        lastId = 0
        for index, client in enumerate(CLIENTS):
            if client['id'] == model['id']:
                client_found = True
                CLIENTS[index] = model
            lastId = client['id']
        if not client_found:
            model['id'] = lastId + 1
            CLIENTS.append(model)
        return CLIENTS

Module = test
