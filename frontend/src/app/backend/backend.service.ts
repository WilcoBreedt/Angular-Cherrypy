import { Injectable } from "@angular/core";
import { Headers, Http, RequestMethod, RequestOptions, Response } from "@angular/http";
import "rxjs/add/operator/toPromise";
import { Observable } from "rxjs";
import "rxjs/add/operator/map";

const headers = new Headers({ "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" });
const options = new RequestOptions({ headers: headers, withCredentials: true });

const url = "http://127.0.0.1:9000/test/"; // <-- This url will be used when posting it should be your server address.
                                              // <-- The /booking is the module which you wish to call.
                                              // <-- /booking/saveClient will call the saveClient function in the module booking.
                                              // ->  This is used by default, edit the proxy.conf.json file in order to let it run through another port and url if desired.
                                              // ng serve --proxy proxy.conf.json
// The format is as follows: http://URL:PORT/Module/Function?YourParamsURLSerialized
// This should be handled in the function calls bellow. Take for example getClients()

@Injectable()
export class BackendService {
    constructor(private http: Http) {
    }

// ===========================================================================================
// ============================= SERVER BACKEND POSTING =====================================
// ==========================================================================================

    /**
     * Function that post the request and serializes the parameters to the backend.
     * @param request - The request that is going to be made to the backend. For example in the case of getClients > http://127.0.0.1:8080/booking/getClients
     * @param parameters - Parameters that should be sent to the backend , these are the positional arguments in the python code of the function your requesting.
     */
    serverPost (request: string, parameters: any = {}): Promise<any> {     
        // The parameters you are sending to the backend are stored in a object with a key parameters, this is to make it easy to unpack and load the parameters in the backend.
        let body = this.serializeObj({parameters: JSON.stringify(parameters)});
        return this.http.post(url+request, body, options)
            .toPromise()
            .then(this.extractData)
            .catch(this.handleError);
    }

    /**
     * The same as the above function, accept it returns a observable on which you can subscribe and wait until data is returned (NON ASYNC).
     * @param request 
     * @param parameters 
     */
    serverObservePost(request: string, parameters: any={}): Observable<any> {
        let body = this.serializeObj({parameters: JSON.stringify(parameters)});
        return this.http.post(url+request, body, options)
            .map(this.extractData)
    }

    /**
     * Function that jsonifies your response received from the backend / server.
     * This function also processes the backend msg for when the user is not logged in and redirects the page back to the login page.
     * @param res - Response received from the server / backend.
     */
    extractData = (res: Response) => {
        let body = res.json();
        return body || {};
    }

    /**
     * Function that handles any error that has happened in the backend, the backend already handles this so this should NEVER be executed, 
     * but just for piece of mind this is here.
     * @param error 
     */
    handleError (error: Response | any) {
        // TODO: Create global logging structure
        console.log("BACKEND SERVICE ERROR");
        console.log(error);
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
// ================================= BACKEND FUNCTIONS =======================================
// ===========================================================================================
    /**
     * Retrieves all the clients in the client table.
     */
    getClients(): Promise<any> {
        return new Promise(resolve => {
            this.serverPost("getClients")
                .then(response => resolve(response))
                .catch(error => {
                    this.handleError(error);
                    resolve({ result: false, msg: error });
                })
        })
    }

// ===========================================================================================
// ===========================================================================================

// ===========================================================================================
// ==================================== EXTRA TOOLS =========================================
// ===========================================================================================

    /**
     * Serializes a object for you and returns the serialized string.
     * @param obj - Object that needs to be serialized.
     */
    serializeObj(obj) {
        var result = [];
        for (var property in obj)
            result.push(encodeURIComponent(property) + "=" + encodeURIComponent(obj[property]));
        return result.join("&");
    }

// ===========================================================================================
// ===========================================================================================
}
