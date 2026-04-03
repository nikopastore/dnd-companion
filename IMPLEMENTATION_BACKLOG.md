# DnD Companion Implementation Backlog

## 0. Immediate

- Apply Prisma migrations:
  - `packages/database/prisma/migrations/20260402203000_builder_inventory_foundation`
  - `packages/database/prisma/migrations/20260402221500_campaign_foundations`
- Verify runtime flows after migration:
  - campaign creation
  - character creation
  - DM item builder and grants
  - party item trade and currency transfer
  - quest/session/NPC/encounter/location builders
- Add visible success/error toasts for new write actions.

## 1. Permissions And Access

- Add campaign-level permission roles:
  - `DM`
  - `CO_DM`
  - `PLAYER`
  - `SPECTATOR`
- Add content visibility model:
  - DM-only
  - player-visible
  - reveal-later
  - private-to-character
- Add co-DM editing rights across notes, NPCs, quests, locations, encounters, and sessions.

## 2. Party Hub

- Add dedicated shared party stash separate from character inventory.
- Add treasury ledger:
  - deposits
  - withdrawals
  - splits
  - transfers
- Add attendance history per session and absent-character handling.
- Add party plans board and pinned announcements.
- Add stronghold / base / ship structured tracker UI.

## 3. Character Systems

- Add subclass flow and level-up assistant.
- Add feats and multiclass support.
- Add spellbook workflow:
  - known vs prepared
  - slots
  - concentration
  - durations
- Add character identity sections:
  - traits
  - ideals
  - bonds
  - flaws
  - goals
  - secrets
  - voice notes
- Add character timeline and “what changed last session?” view.

## 4. DM Prep And Continuity

- Add live note-taking mode during sessions.
- Add prepared-vs-actual session comparison.
- Add consequence engine primitives:
  - faction moves
  - threat clocks
  - scheduled events
  - unresolved mysteries
- Add “prep next session” dashboard block based on:
  - loose threads
  - active factions
  - recent recap
  - party location
  - unfinished quests

## 5. Worldbuilding

- Add structured editors for:
  - factions
  - religions
  - nations
  - organizations
  - cultures
  - historical events
  - calendar data
- Add player-truth vs DM-truth views in UI, not just stored data.
- Add linked lore references between NPCs, locations, items, quests, and factions.

## 6. Items, Economy, And Trade

- Add item history log:
  - found
  - gifted
  - traded
  - sold
  - lost
  - upgraded
  - cursed
- Add shops and merchant inventories.
- Add regional pricing and scarcity modifiers.
- Add request/accept trade workflow instead of only direct transfer.

## 7. Maps And Encounters

- Add actual map pages with image upload and discovered-state tracking.
- Add encounter combat tracker:
  - initiative
  - timers
  - legendary actions
  - lair actions
  - recharge
  - concentration
- Add noncombat encounter tools:
  - chase
  - social conflict
  - skill challenge
  - heist tracker

## 8. Search, Memory, And Analytics

- Extend search to characters, rules, and cross-campaign assets.
- Add “recently relevant” and “forgotten clue” surfacing.
- Add DM analytics:
  - unresolved thread count
  - player spotlight balance
  - faction movement summary
- Add player analytics:
  - growth summary
  - item usage
  - spell usage
  - session participation

## 9. Collaboration And Logistics

- Add group comments/chat and pinned handouts.
- Add scheduling:
  - availability polls
  - RSVP
  - reminders
  - timezone support
- Add recap delivery for missed players.

## 10. Reliability And Platform

- Add autosave/version history for mutable campaign content.
- Add deleted-content restore flow.
- Add campaign duplication / sandbox mode.
- Add print/PDF export for sheets and recaps.
- Add integration groundwork:
  - calendar
  - cloud storage
  - VTT exports
