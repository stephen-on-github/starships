/**
 * Object for a starship
 *
 * @member name        {string} Common name of the ship
 * @member consumables {number} Maximum hours the ship can provide consumables for its crew before resupplying
 * @member MGLT        {number} Maximum number of Megalights the ship can travel in an hour
 *
 * @const api_url           {string} URL of the API used to retrieve data
 * @const distance_error    {string} Message for when there is an issue with a supplied distance
 * @const mglt_error        {string} Message for when there is an issue with the ship's MGLT
 * @const consumables_error {string} Message for when there is an issue with the ship's consumables
 * @const hours_per_day     {number} Number of hours in a day
 * @const days_per_week     {number} Number of days in a week
 * @const days_per_year     {number} Number of days in a year, on average
 * @const months_per_year   {number} Number of months in a year
 * // Constants inferred from previous constants:
 * @const hours_per_week    {number} Number of hours in a week
 * @const hours_per_year    {number} Number of hours in a year, on average
 * @const hours_per_month   {number} Number of hours in a month, on average
 *
 * @function stops_needed     Calculates the number of stops the ship needs to make for a given distance
 * @static   string_to_hours  Converts a formatted time string into the number of hours
 * @static   get_all          Gets a list of all starships from the Star Wars API (Swapi)
 */
class Starship
{
    constructor(data) {
        // Set object data
        this.name        = data.name || '';
        this.consumables = Starship.string_to_hours(data.consumables); // Ensure this is the number of hours.
        this.MGLT        = isNaN(data.MGLT) ? -1 : Number(data.MGLT);  // Ensure this is numeric. Use -1 for unknown.
    }

    /*
     * Constants
     * For better browser support, these are static methods, rather than static members.
     * e.g. `const hours_per_day = 24` will not work in this context in Firefox 69.
     */
    // URL of the API used to retrieve data
    static api_url() { return 'https://swapi.co/api/starships'; };

    // Error message when there are problem with the supplied distance, ship's MGLT or ship's consumables.
    static distance_error()    { return 'Invalid distance'; }
    static mglt_error()        { return 'Unknown MGLT'; }
    static consumables_error() { return 'Unknown consumables'; }

    // Constants, defining time units
    static hours_per_day()   { return 24;     };
    static days_per_week()   { return 7;      };
    static days_per_year()   { return 365.25; };
    static months_per_year() { return 12;     };

    // Time constants inferred from the fundamental ones.
    static hours_per_week()  { return Starship.hours_per_day() * Starship.days_per_week() }
    static hours_per_year()  { return Starship.hours_per_day() * Starship.days_per_year() }
    static hours_per_month() { return Starship.hours_per_year() / Starship.months_per_year() }


    /**
     * Calculate the number of stops needed to travel a given distance.
     *
     * @param distance The number of Megalights being travelled
     * @returns {number|string} The number of stops or a message explaining why the calculation cannot be made
     */
    stops_needed(distance) {
        // Cannot calculate, if the distance, MGLT or consumables are unknown.
        if (isNaN(distance)) {
            return Starship.distance_error();
        }
        if (this.MGLT < 0) {
            return Starship.mglt_error();
        }
        if (this.consumables < 0) {
            return Starship.consumables_error();
        }

        /**
         * Perform the calculation
         * - Get the absolute value of the distance -1000000 Megalights, is assumed to be 1000000 in the opposite
             direction, which requires the same number of stops.
         * - Distance per resupply = MGLT * consumables
         * - Number of resupplies = distance / distance per resupply
         * - Round down. e.g. if 2.8, the ship needs 2 stops and can travel the last .8 without resupplying.
         */
        return Math.floor(Math.abs(distance) / (this.MGLT * this.consumables));
    }

    /**
     * Convert a string representation of a time unit to a number of hours
     * e.g. "2 days" -> 48
     *
     * @param input {string|number} A number or a number followed by a space, followed by a unit; (hour|day|week|year)s?
     *                              May also directly be the number of hours.
     *
     * @returns {number} The number of hours. Returns -1 for malformed input.
     */
    static string_to_hours(input) {
        // Already a number. Assume it is the number of hours.
        if (!isNaN(input) && input >= 0) {
            return input;
        }

        const words = input.split(' ');

        // Return -1 for malformed input.
        if (words.length < 2 || isNaN(words[0]) || words[0] == -1) {
            return -1;
        }

        // First word of the input is the the amount. Second word is the unit.
        const amount = words[0];
        const unit = words[1].replace(/s$/, ''); // Remove trailing "s".

        switch (unit) {
            case 'hour':  return amount;                              break;
            case 'day':   return amount * Starship.hours_per_day();   break;
            case 'week':  return amount * Starship.hours_per_week();  break;
            case 'month': return amount * Starship.hours_per_month(); break;
            case 'year':  return amount * Starship.hours_per_year();  break;
            default:      return -1;                                  break;
        }
    }

    /**
     * Returns a list of all starships from the Stars Wars API (Swapi)
     *
     * Calls a URL, recursively calls its pagination URLs and compiles results into an array of Starship objects.
     *
     * @param callback  {function} Callback run, after each iteration. (use .then() for a callback on full completion)
     * @param url       {string}   The URL to fetch data from the API. Defaults to the `api_url` constant.
     *                             On recursive iterations, the `next` member from the API data is used as the URL.
     * @param starships {Array}    List of starships retrieved, as Starship objects
     */
    static get_all(callback, url, starships = []) {
        url = url || Starship.api_url();

        return new Promise((resolve, reject) => fetch(url)
            // Callback, after connecting to the API
            .then(response => {
                // Error connecting with the server
                if (!response.ok)  {
                    throw Error(`Server error: ${response.status} ${response.statusText}`);
                }

                // Callback after parsing the server response as JSON
                response.json()
                    .then(data => {
                        // Create a Starship object for each result returned from the API and add them to an array.
                        Array.prototype.forEach.call(data.results, result => {
                            starships.push(new Starship(result));
                        });

                        // Callback to run after each iteration as this function recurses
                        if (callback) {
                            callback(url, starships, data.count);
                        }

                        if (data.next) {
                            // If there are more pages of results, recursively call this function.
                            Starship.get_all(callback, data.next, starships).then(resolve).catch(reject);
                        } else {
                            // Run the absolute callback after all results have been fetched.
                            resolve(starships);
                        }
                    })
                    .catch(error => reject(error));
            })
            .catch(error => reject(error))
        );
    }
}
