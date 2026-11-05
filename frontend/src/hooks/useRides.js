import { useCallback, useEffect, useRef, useState } from 'react';
import { cancelRide, getMyRides, getRide, searchRides } from '../api/rides.api.js';

// Loads data via an api/ call whenever `deps` change; returns { data, error, reload }.
// Late responses (after deps changed or the page unmounted) are ignored, and on
// reload the old data stays visible until the new data arrives.
function useLoad(load, deps) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let ignore = false;
    setError(null);
    load()
      .then((result) => {
        if (!ignore) setData(result);
      })
      .catch((err) => {
        if (!ignore) setError(err.message);
      });
    return () => {
      ignore = true;
    };
    // `load` is a new function each render; `deps` lists what it depends on.
  }, [...deps, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { data, error, reload };
}

// The caller's published rides, plus cancelling one.
export function useMyRides() {
  const { data, error, reload } = useLoad(getMyRides, []);

  const cancel = useCallback(
    async (rideId) => {
      try {
        await cancelRide(rideId);
      } finally {
        reload(); // refresh either way, so the list shows the ride's real state
      }
    },
    [reload],
  );

  return { rides: data?.rides ?? null, error, cancel };
}

// One ride by id (public details).
export function useRide(rideId) {
  const { data, error } = useLoad(() => getRide(rideId), [rideId]);
  return { ride: data?.ride ?? null, error };
}

// Ride search on demand. Only the latest search's results are kept, so a slow
// earlier search can't overwrite a newer one.
export function useRideSearch() {
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const latestSearch = useRef(0);

  const search = useCallback(async (criteria) => {
    const searchId = ++latestSearch.current;
    setError(null);
    setLoading(true);
    try {
      const { rides } = await searchRides(criteria);
      if (searchId === latestSearch.current) setResults(rides);
    } catch (err) {
      if (searchId === latestSearch.current) {
        setError(err.message);
        setResults(null);
      }
    } finally {
      if (searchId === latestSearch.current) setLoading(false);
    }
  }, []);

  return { results, error, loading, search };
}
