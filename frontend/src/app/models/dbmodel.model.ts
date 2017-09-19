import { OnInit, Optional, Injectable, ReflectiveInjector } from "@angular/core";
import { HttpModule, Http, RequestOptions, RequestMethod, Headers, Response, BrowserXhr, BaseRequestOptions, CookieXSRFStrategy, BaseResponseOptions, XSRFStrategy, XHRBackend, ConnectionBackend, ResponseOptions } from "@angular/http";
import { Observable } from "rxjs";

const headers = new Headers({ "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" });
const options = new RequestOptions({ headers: headers, withCredentials: true });

const url = "http://127.0.0.1:9000/test/"; // <-- This url will be used when posting it should be your server address.
// <-- The /booking is the module which you wish to call.
// <-- /booking/saveClient will call the saveClient function in the module booking.
// <-- This is used by default, edit the proxy.conf.json file in order to let it run through another port and url if desired.
// ng serve --proxy proxy.conf.json
// The format is as follows: http://URL:PORT/Module/Function?YourParamsURLSerialized
// This should be handled in the function calls bellow. Take for example getClients()

// The design of these models use the propery approach where you defined the field on the model properties itself (I would recommend this model design). To access any field on the class you would use it as follows:
// data = {name: "TestName"} -> Any field in here must be declared in the dbFields and also declared as a property in the model itself. Client model demostrates this.
// a = new YourClass(data);
// name = a.name -> this will return TestName.

// ===================================================================
// ======================= DEFAULT MODEL =============================
// ===================================================================
export class DBModel {
    /**
     * Default values for DBModel
     */
    _name = "DefaultModel";             // Name of this model, this is used to create the save function in the backend. In this case the backend function should be saveDefaultModel.
    _save_func = "save" + this._name;   // Function to call in the backend in order to save the model
    _load_func = "load" + this._name;   // Function to call in the backend in order to load the model
    loadFields = []                     // Fields that are required to load this model from the backend
    http: Http;                         // Http module for backend calls
    saveModel = true;                   // Should this model be able to save
    loadModel = true;                   // Should this model be able to load
    saveKey = "model";                  // The key that should be used for the dictionary that is passed to the backend.
    dbFields = []                       // Array containing fields that should be saved to the backend on save click. None is saved if left blank.
    modelFields = {}                    // Dictionary containing key value pairs of db fields that are instances of other models, this is used to convert those models to the correct values for saving.
    lastModel = {}                      // A snapshot of the model before it is saved and after it is updated.

    /**
     * DB Fields Must be listed here. !!!! THESE FIELDS MUST HAVE DEFAULT VALUES IN ORDER TO WORK !!!!.
     */
    // id : string = null;
    // name : string = "";
    // surname : string = "";
    /**
     * Constructor of the base class , initialize the http module and also call the init process.
     * @param data [Object] - Data the class should be initiated with, if nothing is provided the default values are used.
     */
    constructor(data?) {
        this.http = ReflectiveInjector.resolveAndCreate([
            Http,
            BrowserXhr,
            { provide: RequestOptions, useClass: BaseRequestOptions },
            { provide: ResponseOptions, useClass: BaseResponseOptions },
            { provide: ConnectionBackend, useClass: XHRBackend },
            { provide: XSRFStrategy, useFactory: () => new CookieXSRFStrategy() },
        ]).get(Http);
    }

    /**
     * Updates the fields object with new values.
     * @param {object} data - Data that the fields should be updated with.
     */
    update(data) {
        for (var key in data) {
            if (this.hasOwnProperty(key) && this.dbFields.indexOf(key) > -1) {
                if (this.modelFields.hasOwnProperty(key)) {
                    if (this[key] instanceof Array && data[key] instanceof Array) {
                        this[key] = data[key].map(e => new this.modelFields[key](e));
                    } else {
                        this[key] = new this.modelFields[key](data[key])
                    }
                } else {
                    this[key] = data[key];
                }
            }
        }
        this.lastModel = this.values();
        return this;
    }

    /**
     * WHEN YOU WANT TO SUBSCRIBE TO THE RESULT AND DO SOMETHING.
     * Function to save the model. Updates the model after the save and returns an observable that you can subscribe to.
     * @returns {observable} - Returns a observable of the response when done.
     */
    saveSubscribe(): Observable<any> {
        if (this.saveModel) {
            let model = {};
            let fields = this.values();
            model[this.saveKey] = fields;
            let body = this.serializeObj({ parameters: JSON.stringify(model) });
            // If you wish to update the model, need to wait for save to complete (non async).
            return this.http.post(url + this._save_func, body, options)
                .map(res => {
                    let response_data = this.extractData(res);
                    if (response_data.result) {
                        this.update(response_data.data);
                    }
                    return response_data;
                })
        } else {
            console.log("ERROR: " + this._name + " MODEL MAY NOT BE SAVED !");
        }
    }

    /**
     * WHEN YOU DO NOT CARE ABOUT THE SUBSCRIBTION, THIS IS DONE AUTOMATICALLY AND JUST UPDATED.
     * Function to save the model. Updates the model after the save.
     * @returns {object} - The repsonse data.
     */
    saveUpdate() {
        if (this.saveModel) {
            let model = {};
            let fields = this.values();
            model[this.saveKey] = fields;
            let body = this.serializeObj({ parameters: JSON.stringify(model) });
            // If you wish to update the model, need to wait for save to complete (non async).
            return this.http.post(url + this._save_func, body, options)
                .map(res => {
                    let response_data = this.extractData(res);
                    if (response_data.result) {
                        this.update(response_data.data);
                    }
                    return response_data;
                }).subscribe();
        } else {
            console.log("ERROR: " + this._name + " MODEL MAY NOT BE SAVED !");
        }
    }

    /**
     * Function to save the model.
     * @returns {promise} - Returns a promise response if the update if false, returns a Observable that you can subscribe to if the update is true.
     */
    save(): Promise<any> {
        // If you would like the model to update itself after the save, just pass in the true on the save function. 
        if (this.saveModel) {
            let model = {};
            let fields = this.values();
            model[this.saveKey] = fields;
            let body = this.serializeObj({ parameters: JSON.stringify(model) });
            return this.http.post(url + this._save_func, body, options)
                .toPromise()
                .then(this.extractData)
                .catch(this.handleError);
        } else {
            console.log("ERROR: " + this._name + " MODEL MAY NOT BE SAVED !");
        }
    }

    /**
     * Function that initializes the data and is called upon construction.
     * @param {object} data - Data that the model fields must be initialized with.
     */
    init(data?) {
        if (data) {
            this.update(data);
        }
        this.lastModel = this.values();
        this._save_func = "save" + this._name;
        this._load_func = "load" + this._name;
    }
    /**
     * Function that returns the current model in a json format ready for saving, this extracts data from all of the other models also.
     * Basically this functions returns a saveable db model of the current object. JSONIFY the model.
     * @returns {object} - The JSONIFIED version of the current object.
     */
    values() {
        let data = {}
        this.dbFields.forEach(e => {
            if (this.modelFields.hasOwnProperty(e)) {
                if (this[e] instanceof Array) {
                    data[e] = this[e].map(i => i.values());
                } else {
                    data[e] = this[e].values();
                }
            } else {
                data[e] = this[e];
            }
        });
        return data;
    }

    /**
     * @returns {string} - The stringified version of the current object.
     */
    toString() {
        return JSON.stringify(this.values());
    }

    /**
     * Function that loads the model from the backend provided the correct parameters/fields needed to load the model.
    */
    load() {
        if (this.loadModel) {
            let model = {};
            let fields = {};
            this.loadFields.forEach(e => {
                fields[e] = this[e];
            });
            model[this.saveKey] = fields;
            let body = this.serializeObj({ parameters: JSON.stringify(model) });
            return this.http.post(url + this._load_func, body, options)
                .toPromise()
                .then(res => {
                    let response_data = this.extractData(res);
                    if (response_data.result) {
                        this.update(response_data.data);
                    }
                    return response_data;
                })
                .catch(this.handleError);
        } else {
            console.log("ERROR: " + this._name + " MODEL MAY NOT BE LOADED !");
        }
    }

    /**
     * Function that checks whether the current model has any changes on it since you loaded it 
     * @returns {boolean} - The status of the changes on the model.
    */
    hasChanged() {
        return !(JSON.stringify(this.lastModel) === this.toString());
    }

    // ==========================================================================================
    // ============================= SERVER BACKEND POSTING =====================================
    // ==========================================================================================

    /**
     * Function that post the request and serializes the parameters to the backend.
     * @param {string} request - The request that is going to be made to the backend. For example in the case of getClients > http://127.0.0.1:8080/booking/getClients
     * @param {any} parameters - Parameters that should be sent to the backend , these are the positional arguments in the python code of the function your requesting.
     */
    serverPost(request: string, parameters: any = {}): Promise<any> {
        // The parameters you are sending to the backend are stored in a object with a key parameters, this is to make it easy to unpack and load the parameters in the backend.
        let body = this.serializeObj({ parameters: JSON.stringify(parameters) });
        return this.http.post(url + request, body, options)
            .toPromise()
            .then(this.extractData)
            .catch(this.handleError);
    }

    /**
     * Function that jsonifies your response received from the backend / server.
     * This function also processes the backend msg for when the user is not logged in and redirects the page back to the login page.
     * @param {response} res - Response received from the server / backend.
     */
    extractData = (res: Response) => {
        let body = res.json();
        return body || {};
    }

    /**
     * Function that handles any error that has happened in the backend, the backend already handles this so this should NEVER be executed, 
     * but just for piece of mind this is here.
     * @param {response|any} error - Error that has occured.
     */
    handleError(error: Response | any) {
        // TODO: Create global logging structure
        console.log("BACKEND SERVICE ERROR", error);
        let errMsg: string;
        if (error instanceof Response) {
            const body = error.json() || "";
            const err = body.error || JSON.stringify(body);
            errMsg = `${error.status} - ${error.statusText || ""} ${err}`;
        } else {
            errMsg = error.message ? error.message : error.toString();
        }
        console.error(errMsg);
        return Promise.reject(errMsg);
    }

    // ===========================================================================================
    // ===========================================================================================

    // ===========================================================================================
    // ==================================== BACKEND STUFF ========================================
    // ===========================================================================================

    /**
     * Serializes a object for you and returns the serialized string.
     * @param {object} obj - Object that needs to be serialized.
     */
    serializeObj(obj) {
        var result = [];
        for (var property in obj)
            result.push(encodeURIComponent(property) + "=" + encodeURIComponent(obj[property]));
        return result.join("&");
    }
}

// ===========================================================================================
// ===========================================================================================
