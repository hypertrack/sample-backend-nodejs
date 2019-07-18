const summaries = require('./summary.controller');
const locations = require('./location.controller');

// Add summary
exports.addSummary = (data) => {
    summaries.addOne({
        recorded_at: data.recorded_at,
        device_id: data.device_id,
        distance: data.distance,
        steps: data.steps,
        duration: data.duration,
        start_datetime: data.start_datetime,
        end_datetime: data.end_datetime,
        segments: data.segments
    });
};

// Add location update
exports.addLocation = (data) => {
    locations.addOne({
        recorded_at: data.recorded_at,
        device_id: data.device_id,
        altitude: data.altitude,
        bearing: data.bearing,
        speed: data.speed,
        location_accuracy: data.location_accuracy,
        location: data.location
    });
};

exports.handleLocationUpdate = async (data) => {
    // update device in DB
    return await mongoose.model('Device').findOneAndUpdate(
        // filter: by device_id
        {
            device_id: data.device_id
        },
        // update: location data
        {
            location: {
                data: data.data,
                recorded_at: data.recorded_at
            }
        },
        // callback
        function (err, res) {
            if (err) throw err;

            return res;
        });
};