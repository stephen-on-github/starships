(function() {
    let starships = [];
    initialize_app();

    function initialize_app()
    {
        // Show the loading screen.
        show_section('#app-loading');

        // Ensure the list of starships is reset.
        starships = [];

        // Fetch all starships from the API.
        Starship.get_all(show_loading_progress)
            // Once retrieved, show the app section.
            .then(response => {
                starships = response;

                show_section('#app');
            })
            // If there was an error, show the error section.
            .catch(error => {
                document.getElementById('app-error-message').textContent = error.message;
                show_section('#app-error');
            })
    }

    /**
     * -----------------------------------------------------------------------------------
     * DOM-manipulation functions
     *
     * @function show_section           Makes a section visible and hides all other sections in the group
     * @function show_loading progress  Displays progress, as data is fetched from the API
     * @function add_table_rows         Creates table rows from data
     * -----------------------------------------------------------------------------------
     */

    /**
     * Makes a section visible and hides all other sections in the group
     *
     * @param selector {string} Query string for the section to show
     */
    function show_section(selector)
    {
        // Hide other sections
        const sections = document.querySelectorAll('.app-visibility-section');
        Array.prototype.forEach.call(sections, section => {
            section.classList.add('hidden');
        });

        // Show selected section
        document.querySelector(selector).classList.remove('hidden');
    }

    /**
     * Displays progress meter, as data is fetched from the API
     *
     * @param url       {string} The last URL that data was retrieved from
     * @param starships {Array}  Array of all starships loaded, to date
     * @param total     {number} The total number of starships to load
     */
    function show_loading_progress(url, starships, total)
    {
        const loaded = starships.length;

        // Keep track of requests in the console.
        console.log(`data loaded from ${url}.`);

        // Show a message indicating progress.
        document.getElementById('app-loading-progress').innerText = `${loaded} of ${total} starships loaded.`;

        // Set the width of the progress bar.
        document.querySelector('#app-loading-meter > span').style.width = (loaded / total * 100) + '%';

        if (starships.length != total) {
            // Show the loading screen, while loading.
            show_section('#app-loading')
        } else {
            // Show the app when done.
            show_section('#app');
        }
    }

    /**
     * Add rows to a table
     *
     * @param table {HTMLElement} The table to add the rows to
     * @param data  {Array}       Array of data, used to populate the table
     */
    function add_table_rows(table, data)
    {
        let row = table.getElementsByTagName('tbody')[0].insertRow();

        for (let key in data) {
            let cell = row.insertCell();

            // Numeric cells to be right-aligned and numbers to be formatted
            if (!isNaN(data[key])) {
                cell.classList.add('text-right');
                data[key] = data[key].toLocaleString();
            }

            let text = document.createTextNode(data[key]);
            cell.appendChild(text);
        }
    }

    /**
     * -----------------------------------------------------------------------------------
     * Event listeners
     * -----------------------------------------------------------------------------------
     */

    // When the distance is changed, populate the table data.
    document.getElementById('app-distance').onchange = function() {
        const distance = this.value;
        const table = document.getElementById('app-stops-table');

        // Ensure the table is visible and clear previous data.
        table.getElementsByTagName('tbody')[0].innerHTML = '';
        table.classList.remove('hidden');

        // Populate the table with data from the starship objects.
        Array.prototype.forEach.call(starships, starship => {
            add_table_rows(table, [starship.name, starship.stops_needed(distance)]);
        });
    };

    // Run the distance-changing event, when the button is clicked
    // An alternative event because it is not obvious that the distance field needs to lose focus to trigger the event.
    document.getElementById('app-distance-calculate').onclick = function() {
        document.getElementById('app-distance').dispatchEvent(new Event('change'));
    };

    // Rerun the initialisation function, if the user clicks "Retry", after a failure to fetch API data.
    document.getElementById('app-error-retry').onclick = initialize_app;

    // Switch between light and dark mode
    document.getElementById('mode-switcher-dark').onchange = function() {
        document.getElementsByTagName('body')[0].classList.toggle('mode-dark', this.checked);
    };
})();