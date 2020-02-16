QUnit.test('String-to-hours conversion', assert => {
    // The second figures are hardcoded, rather than compared with the constants defined in the Starship class.
    // This is to avoid potentially having two errors cancel each other out.
    assert.equal(Starship.string_to_hours(5),             5,        'Numeric input works');
    assert.equal(Starship.string_to_hours('1 day'),      24,        'Single day input works');
    assert.equal(Starship.string_to_hours('2 day'),      48,        'Plural day input works');
    assert.equal(Starship.string_to_hours('1 week'),     24*7,      'Single week input works');
    assert.equal(Starship.string_to_hours('2 weeks'),    48*7,      'Plural week input works');
    assert.equal(Starship.string_to_hours('1 month'),  `730.5`,     'Single month input works');
    assert.equal(Starship.string_to_hours('2 months'), `730.5`*2,   'Plural month input works');
    assert.equal(Starship.string_to_hours('1 year'),   `365.25`*24, 'Single year input works');
    assert.equal(Starship.string_to_hours('2 years'),  `365.25`*48, 'Plural year input works');
    assert.equal(Starship.string_to_hours('unknown'),    -1,        'Non-compliant input returns -1');
});

QUnit.test('Starship-object initialisation', assert => {
    // Create a Starship object by directly supplying data.
    const ship = new Starship({ name: 'Millennium Falcon', consumables: '2 months', MGLT: '75' });

    // Check that the object data initialised correctly.
    assert.strictEqual(ship.name,        'Millennium Falcon', 'Name loads correctly');
    assert.strictEqual(ship.consumables, `730.5`*2,           'Consumables loads correctly');
    assert.strictEqual(ship.MGLT,        75,                  'MGLT loads correctly');
});

QUnit.test('Starships are fetched from the API', assert => {
    // Ensure that this test is not finished until after the asynchronous request is complete.
    // i.e. after the data has been retrieved from the server or its been established that there is connection error.
    // These are signalled by running `done()`.
    const done = assert.async();

    Starship.get_all()
        .then(starships => {
            assert.ok(starships.length > 0, 'Ships have been loaded');
            done();

            // Run this test after the API request has finished. i.e. after the retrieved data is available for testing.
            QUnit.test('Number of necessary stops are calculated correctly', assert => {
                const distance    = 1000000;
                // Find particular starships, by searching the API results by name.
                const y_wing      = starships.filter(starship => starship.name == 'Y-wing')[0];
                const m_falcon    = starships.filter(starship => starship.name == 'Millennium Falcon')[0];
                const r_transport = starships.filter(starship => starship.name == 'Rebel transport')[0];

                // Check if the particular starships were found if their necessary stops are calculated correctly.
                assert.strictEqual(y_wing      && y_wing.stops_needed(distance),       74, 'Y-Wing stops are calculated correctly.');
                assert.strictEqual(m_falcon    && m_falcon.stops_needed(distance),      9, 'Millennium Falcon stops are calculated correctly.');
                assert.strictEqual(r_transport && r_transport.stops_needed(distance),  11, 'Rebel Transport stops are calculated correctly.');
            });
        })
        .catch(error => {
            console.log(error);
            // Force the test to fail, if server data is not retrieved.
            assert.ok(false, 'Ships have been loaded');
            done();
        })
    ;
});

QUnit.test('Necessary-stops-calculaton error messages', assert => {
    const unknown_mglt        = new Starship({ name: 'Test 1', consumables: '3 weeks', MGLT: 'unknown' });
    const unknown_consumables = new Starship({ name: 'Test 2', consumables: 'unknown', MGLT: '88'      });

    assert.strictEqual(unknown_mglt.stops_needed('unknown'),      Starship.distance_error(),    'Distance error message works.');
    assert.strictEqual(unknown_mglt.stops_needed(1000000),        Starship.mglt_error(),        'MGLT error message works.');
    assert.strictEqual(unknown_consumables.stops_needed(1000000), Starship.consumables_error(), 'Consumables error message works.');
});


