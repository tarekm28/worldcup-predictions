import https from 'https';

const url = 'https://worldcup26.ir/get/games';

https.get(url, { headers: { accept: 'application/json' } }, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    try {
      const data = JSON.parse(body);
      const games = data.games || data;
      const sample = games.slice(0, 20).map(g => ({
        id: g.id,
        local_date: g.local_date,
        finished: g.finished,
        time_elapsed: g.time_elapsed,
        home_score: g.home_score,
        away_score: g.away_score,
        group: g.group,
        matchday: g.matchday,
        type: g.type,
        home_team_id: g.home_team_id,
        away_team_id: g.away_team_id,
      }));
      console.log(JSON.stringify(sample, null, 2));
    } catch (err) {
      console.error('parse error', err);
      process.exit(1);
    }
  });
}).on('error', (err) => {
  console.error('fetch error', err);
  process.exit(1);
});
