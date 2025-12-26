// Global variables (mirroring GameState model)
VAR public_approval = 50
VAR international_rep = 50
VAR economic_stability = 50
VAR moral_integrity = 50
VAR budget = 100
VAR legacy_points = 0
VAR day = 1
VAR game_over = false
VAR current_activity = "none"

// Faction relations
VAR conservative_support = 50
VAR progressive_support = 50
VAR corporate_support = 50
VAR ngo_support = 50

// Conspiracy metrics
VAR deep_state_influence = 50
VAR ufo_secrecy = 80

// Player stats
VAR charisma = 50
VAR intelligence = 70

// Story flags
VAR cyber_threat_active = false
VAR trade_war_triggered = false
VAR protest_escalated = false

// === Main Game Loop ===
-> morning_briefing

// === Activity 1: Intelligence Briefing ===
=== morning_briefing ===
~ current_activity = "intelligence_briefing"
It's {day} of your presidency, President Fictious. The Situation Room is buzzing. Your intelligence advisor briefs you: a cyber threat from a rogue nation is emerging, but there's also chatter about a potential UFO sighting going viral on X. You can only focus on one today.

* [Prioritize the cyber threat]
    ~ intelligence += 10
    ~ cyber_threat_active = true
    ~ public_approval -= 5
    ~ deep_state_influence += 10
    Your team diverts resources to counter the cyber threat. The public grows anxious about government secrecy, and conspiracy theories spread. -> policy_meeting
* [Investigate the UFO sighting]
    ~ ufo_secrecy -= 15
    ~ public_approval += 10
    ~ moral_integrity -= 5
    You order a public investigation into the UFO sighting. Social media loves the transparency, but your advisors warn of credibility risks. -> policy_meeting
* {intelligence >= 80} [Cross-reference both with classified data]
    ~ legacy_points += 5
    ~ international_rep += 5
    Your sharp intellect uncovers a link: the cyber threat may be a cover for foreign surveillance. Allies commend your insight. -> policy_meeting

// === Activity 2: Policy Meeting ===
=== policy_meeting ===
~ current_activity = "policy_meeting"
In the Cabinet Room, advisors debate a new energy bill. Progressives push for green energy, but corporate factions want fossil fuel subsidies. Your budget is {budget} units. How do you proceed?

* [Support green energy (Cost: 30 budget)]
    {budget >= 30:
        ~ budget -= 30
        ~ progressive_support += 15
        ~ corporate_support -= 10
        ~ economic_stability -= 5
        ~ public_approval += 10
        The green bill passes, thrilling environmentalists. Industry leaders threaten layoffs. -> diplomatic_engagement
    - else:
        You lack the funds. Advisors are frustrated. -> diplomatic_engagement
    }
* [Back fossil fuels (Cost: 20 budget)]
    {budget >= 20:
        ~ budget -= 20
        ~ corporate_support += 15
        ~ progressive_support -= 10
        ~ moral_integrity -= 5
        ~ public_approval -= 5
        Fossil fuel subsidies pass. Corporations praise you, but protests erupt outside. ~ protest_escalated = true -> diplomatic_engagement
    - else:
        You lack the funds. Advisors are frustrated. -> diplomatic_engagement
    }
* {charisma >= 60} [Propose a compromise]
    ~ legacy_points += 5
    ~ budget -= 15
    ~ progressive_support += 5
    ~ corporate_support += 5
    Your charm brokers a hybrid plan, but it stretches the budget thin. -> diplomatic_engagement

// === Activity 3: Diplomatic Engagement ===
=== diplomatic_engagement ===
~ current_activity = "diplomatic_engagement"
A tense call with a rival nation's leader. They're demanding trade concessions, or they'll escalate tariffs. Your charisma is {charisma}. How do you respond?

* [Offer aid to ease tensions]
    ~ budget -= 10
    ~ international_rep += 10
    ~ economic_stability -= 5
    The aid package calms the situation, but domestic critics call it weak. -> public_address
* [Impose counter-tariffs]
    ~ international_rep -= 10
    ~ corporate_support += 5
    ~ trade_war_triggered = true
    You stand firm, sparking a trade war. Businesses rally, but markets wobble. -> public_address
* {charisma >= 70} [Negotiate a secret deal]
    ~ legacy_points += 5
    ~ deep_state_influence += 5
    ~ international_rep += 5
    A backchannel deal averts conflict, but rumors of covert ops surface. -> public_address

// === Activity 4: Public Address ===
=== public_address ===
~ current_activity = "public_address"
Time for a national address from the Oval Office. The nation is watching, and X is trending. {protest_escalated: Protests are escalating.} {trade_war_triggered: Trade war fears loom.} How do you frame your speech?

* [Inspirational: Rally the nation]
    ~ public_approval += 15
    ~ moral_integrity += 5
    ~ conservative_support -= 5
    Your soaring words unite many, but skeptics call it empty rhetoric. -> crisis_management
* [Tough talk: Project strength]
    ~ public_approval += 5
    ~ conservative_support += 10
    ~ international_rep -= 5
    Your hardline stance fires up your base, but allies distance themselves. -> crisis_management
* [Humorous: Go viral]
    ~ public_approval += 10
    ~ charisma += 5
    ~ moral_integrity -= 5
    A witty quip trends online, but serious issues are downplayed. -> crisis_management

// === Activity 5: Crisis Management ===
=== crisis_management ===
~ current_activity = "crisis_management"
{protest_escalated: A protest turns violent outside the Capitol.} {trade_war_triggered: Markets crash due to trade war fears.} {not protest_escalated and not trade_war_triggered: A hurricane hits the coast.} You have 30 seconds to act!

* [Act fast: Deploy resources]
    {protest_escalated:
        ~ public_approval -= 10
        ~ moral_integrity -= 5
        ~ legacy_points += 5
        National Guard deployment restores order, but civil liberties concerns rise.
    - else:
        ~ budget -= 20
        ~ public_approval += 10
        Emergency funds save lives, but the treasury takes a hit.
    } -> strategic_planning
* [Negotiate: Seek dialogue]
    {protest_escalated:
        ~ public_approval += 5
        ~ moral_integrity += 5
        Talks de-escalate tensions, but unrest lingers.
    - else:
        ~ public_approval -= 5
        Delays worsen the crisis; the public blames you.
    } -> strategic_planning
* {intelligence >= 75} [Analyze and delegate]
    ~ legacy_points += 10
    Your team's swift, data-driven response mitigates damage. -> strategic_planning

// === Activity 6: Strategic Planning ===
=== strategic_planning ===
~ current_activity = "strategic_planning"
Evening in the West Wing. You review polls: Approval is {public_approval}%. {budget <= 20: Budget is critically low.} {international_rep <= 30: Allies are wary.} Plan your next move.

* [Invest in reelection campaign]
    ~ budget -= 10
    ~ public_approval += 10
    Ads boost your image, but reforms stall. -> end_day
* [Push major reforms]
    ~ legacy_points += 10
    ~ public_approval -= 5
    ~ moral_integrity += 5
    Bold policies define your legacy, but voters grumble. -> end_day
* {legacy_points >= 20} [Secure a historic treaty]
    ~ legacy_points += 15
    ~ international_rep += 10
    A global accord cements your name in history. -> end_day

// === End Day ===
=== end_day ===
~ day += 1
{public_approval <= 20:
    The nation has lost faith. Congress moves to impeach you.
    ~ game_over = true
    -> game_end
}
{legacy_points >= 50:
    Your leadership secures a second term!
    ~ game_over = true
    -> game_end
}
{budget <= 0:
    The government shuts down. Your presidency crumbles.
    ~ game_over = true
    -> game_end
}
Day {day} awaits, President. -> morning_briefing

// === Game End ===
=== game_end ===
{
    - public_approval <= 20:
        Impeached! Your presidency ends in disgrace.
    - legacy_points >= 50:
        Reelected! Your legacy shines.
    - budget <= 0:
        Shutdown! Economic collapse defines your term.
    - else:
        Your term continues, but challenges mount.
}
-> END
