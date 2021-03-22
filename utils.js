/**
 * @description Check if the types given are conform to the types filled in
 * @param {Array[]} args 
 * @returns {boolean} true or false
 */
export function typeVerification(...args) {
    const validatedTypes = args.filter(function(argument) {
        // Verify if every entries in args are Arrays, two values.
        if (!Array.isArray(argument)) {
            throw TypeError("Every parameters must be Arrays");
        } else if (argument.length > 2 || argument.length < 2) {
            throw RangeError("Every parameters must be with two entries [data, type], Given: [" + argument + "]");
        } else if (typeof argument[1] !== "string") {
            throw TypeError("The type must be a string. Example: 'number', 'string', 'object'");            
        }

        const [value, type] = argument;
        if (type === "array" && Array.isArray(value)) {
            return argument;
        }else if (typeof value === type) {
            return argument;
        }
    });
    return validatedTypes.length === args.length;
}