import { typeVerification } from "./utils.js";

export default (function StateSystem() {

    const store = {};
    /**
     * @type {[{ fnc: Function, states: string[] }]}
     */
    const subscribedFunctions = [];

    /**
     * @description Ajoute un state au Store
     * @param {String} name
     * @param {String} value
     */
    function addState(name, value = null) {
        if (typeVerification([name, "string"])) {
            store[name] = value;
        } else {
            throw TypeError("name must be a string");
        }
    }

    /**
     * @description Retourne la valeur du state du nom donnée
     * @param {String} name 
     */
    function getState(name) {
        if (typeVerification([name, "string"])) {
            if (name in store) {
                return store[name];
            } else {
                throw ReferenceError("Unknown state")
            }
        } else {
            throw TypeError("name must be a string");
        }
    }

    /**
     * @description Modification d'un state
     * @param {String} name 
     * @param {*} data 
     */
    function dispatch(name = "", data = null) {
        if (typeVerification([name, "string"])) {
            if (name in store) {
                if (store[name] === data) {
                    return;
                }
                // We change the data and so on update the state if the data is different
                store[name] = data;

                subscribedFunctions.forEach(function (subFunction) {
                    const {
                        fnc,
                        states
                    } = subFunction;
                    if (states.includes(name)) {
                        /**
                         * @type {{ state }} statesParams
                         */
                        const statesParams = {};
                        states.forEach(function (state) {
                            statesParams[state] = getState(state);
                        });
                        fnc.apply(null, [statesParams]);
                    }
                });

            } else {
                throw ReferenceError("Unknown state")
            }
        } else {
            throw TypeError("name must be a string");
        }
    }

    /**
     * @description Permet d'affecter une fonction pour que lorsqu'un **dispatch** est effectuer celle-ci soit activée
     * @param {Function} callback 
     * @param {string[]} states - Liste de nom de state
     * @returns {Function} Retourne la fonction **unsubscribe** permettant de retirer l'activation fonction
     */
    function subscribe(callback, states = []) {
        if (typeVerification([callback, "function"], [states, "array"])) {
            // On essaie d'accéder aux states renseignés
            states.forEach(state => getState(state));
            subscribedFunctions.push({
                fnc: callback,
                states
            });
            return {
                unsubscribe: () => unsubscribe(callback)
            };
        } else {
            throw TypeError("State.subscribe arguments must be (function, array[])");
        }
    }

    /**
     * @description Permet de retirer l'activation de la fonction attribué
     * @param {Function} callback 
     */
    function unsubscribe(callback) {
        if (typeVerification([callback, "function"])) {
            const cbIndex = subscribedFunctions.indexOf(callback);
            if (cbIndex > 0) {
                subscribedFunctions.splice(cbIndex, 1);
            }
        } else {
            throw TypeError("unsubscribe argument must be an function");
        }
    }

    return {
        addState,
        getState,
        subscribe,
        dispatch
    }
})()