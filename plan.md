# Yates Cup Planning Questions

This document is for collecting answers before building the World Cup knockout bracket site. After these are answered, we can turn the decisions into a final implementation plan with only concrete choices.

## Current Vision

Build a private/friends World Cup knockout bracket challenge at `yatescup.com`, similar to NCAA March Madness bracket pools.

Core features:

- Users submit a full knockout bracket.
- A leaderboard shows each person and their current score.
- Clicking a person shows their full bracket picks.
- Actual match results update brackets automatically if possible.
- Correct picks are marked clearly with green check marks.
- Incorrect or eliminated future picks are marked clearly with red X marks.
- Bracket layout should show 16 teams on the left side and 16 teams on the right side, with country names and flags.

## Initial Recommendation

For fastest launch and lowest maintenance, I recommend a managed stack instead of running an EC2 server at first:

- Frontend and app hosting: Vercel, Netlify, or Cloudflare Pages.
- Database and authentication: Supabase.
- Domain: buy `yatescup.com` through GoDaddy, then point DNS to the hosting provider.
- Live match data: use a football/soccer API if a reliable free or low-cost source is available; otherwise build a small admin page where you manually enter official results.

AWS EC2 is possible, especially since you already have AWS, but it adds server setup, SSL, deployment, monitoring, backups, and patching. For a friends-and-family bracket site, managed hosting will usually be easier and more reliable.

## Questions To Answer

### 1. Event And Scope

1. Which World Cup is this for? 2026
2. Is this for the men's World Cup, women's World Cup, Club World Cup, or another tournament? mens
3. Do you only want the knockout stage, or should the site support group-stage predictions too? only knockouts. today is 2026/08/26 so all of the group stage games have already been played. 
4. Should the bracket start at the round of 32, round of 16, or another round? round of 32. you can reasearch to see what teams qualified and where. 
5. Do you already know the 32 teams, or should the site load them from an API or admin entry? round of 32 teams can be hardcoded, since we already know who's playing who. it can be found at https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_knockout_stage or elsewhere. 
there should be an api request to somewhere to get results of games.  Canada already played their game, so that will be our test game to make sure the api's are working. 


### 2. Users And Access

1. How many friends do you expect to participate? 10 or so 
2. Should anyone with the link be able to join, or should joining require an invite code? to be clear, people have already texted me their picks. I am going to manually enter them in. so this website just needs to worry about scoring the brackets and having a nice UI for viewing. 
3. Should users create accounts with email/password, magic links, Google login, or just a display name plus private edit link? no logins. this website is view - only. i will add my friend's picks manually to a json or something here. 
4. Should users be able to edit their bracket before a deadline? no editing. 
5. After the deadline, should brackets become locked and publicly viewable to the group? no deadline , no editing. 
6. Do you need an admin account for yourself? no. website is view only. and ill make changes directly through opencode if needed. 

### 3. Bracket Submission Rules

NO bracket submissions. I will manually enter in theie names and picks for their brackets.

### 4. Scoring

round of 32 = 1 point, round of 16 = 2, quarterfinals = 3, semifinals = 4, final = 5. 
we should display each persons total points and total possible points. 
Tie breaker should be, in order,  1) user's total possible points - higher is better. 
then the second tie breaker would be: 2) alphabetical based on their name.  

### 5. Results And Live Updates

1. Do you strongly want automatic live updates from an API, or is manual admin result entry acceptable if the API is limited or costly? manual would be alright if it comes to it. when it comes time we can do some testing to see if its feasible 
2. Should scores update live during matches, or only after matches are final? whichever is easier - im guessing only once final is easier. 
3. Which matters most: free API, reliability, real-time updates, or easy setup? free api 
4. Are you willing to pay for a sports data API if needed? no. 
5. Should the site show match dates, kickoff times, venues, and scores? nah. team names and flags is fine. 
6. Should we store final results in our own database even if they come from an API? yes, that sounds easier right? and the scores should be displayed on the bracket too. 

### 6. Visual Design

1. Do you want the site to look playful, clean/professional, sports-betting style, or like an NCAA bracket site? NCAA bracket site.  leaderboard of rows listing names, total points, and total possible points. if you click a row, it should open a page showing that persons bracket. 
2. Do you have a preferred color scheme? something world-cupy. 
3. Should the bracket be optimized primarily for desktop, mobile, or both equally? mobile 
4. Should mobile show the full bracket horizontally scrollable, stacked by rounds, or as a simplified match list? I'll give you some freedom here. whatever is typically done to show the 32 teams in a clean way. 
5. Do you want country flags from emoji, image files, or a flag API/library? doesnt matter to me. 
6. Do you have a logo or name treatment for Yates Cup, or should we create a simple text-based brand? text based is fine. 

### 7. Leaderboard And Bracket Viewing

1. What columns should the leaderboard show? rank, name, points, champion pick, possible remaining points.
2. Example columns: rank, name, points, champion pick, possible remaining points. yupp loogs good to me. 
3. Should users be able to click any participant and see their bracket? yes
4. Should a user's bracket show correct/incorrect markers next to every pick? yes
5. Should the leaderboard update immediately after results are entered? yes. ideally results should come from an api. but otherwise i will add the picks. 
6. Should the site show a user's maximum possible score after eliminations? yes
7. Should there be a separate page for overall tournament results? nah

### 8. Admin Features

1. Should you be able to manually add or edit teams? no
2. Should you be able to manually enter match results? no, not via the website ui. 
3. Should you be able to lock bracket submissions at a specific deadline? no bracket submissions. i will manually add brackets via a json file in this directory or wherever you tell me to. 
4. Should you be able to invite/remove users? no. publicly viewable read-only website. 
6. Should there be a simple admin dashboard, or is direct database editing acceptable at first? direct database editing is better. no admin version. 

### 9. Hosting And Domain

1. Are you planning to buy `yatescup.com` through GoDaddy?  yes. 
2. Do you want to keep DNS at GoDaddy, or are you comfortable moving DNS to Cloudflare? whatever is easier - im guessing thats godaddy. 
3. Do you prefer the easiest managed deployment, or do you specifically want AWS EC2? i dont care. im somewhat leaning towards aws because i've found it easier in the past. but if you think we should do something else, thats ok. in the final plan .md layout the couple of options. 
4. If using AWS, are you comfortable managing Linux, nginx, SSL certificates, deployments, backups, and uptime?
5. Would you prefer a mostly free stack if possible? cheaper is better but whatever is easy 
6. Do you want the site available publicly, or hidden behind login/invite only? publicly available. 

### 10. Tech Stack Preferences

1. Do you have any preference for React, Next.js, plain HTML/CSS/JS, or another framework? no preference. 
2. Are you comfortable using Supabase for database and auth? i know nothing about supabase. im cool with sqlite for database. theres nothing public facing as i mentioned. 

### 11. Data And Privacy

1. What user data should be collected? none. its a read only website with no concept of users. 
