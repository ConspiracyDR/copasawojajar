# Requirements Document

## Introduction

Copa Sawo Jajar is a Progressive Web Application (PWA) for managing a local football tournament. The application serves 1-2 organizers who input match scores, track standings (klasemen), and view schedules from a smartphone at the field or a laptop at home. The tournament consists of 2 groups of 4 teams each, playing round-robin format (12 total matches). The application uses localStorage for persistence, requires no backend, and works offline.

## Glossary

- **Application**: The Copa Sawo Jajar Tournament Management PWA
- **Organizer**: The single admin user who inputs and manages match data
- **Match**: A single football game between two teams in the same group
- **Group**: A division of teams (Group A or Group B), each containing 4 teams
- **Team**: One of 8 pre-configured football teams assigned to a group
- **Scorer**: A record of a goal scored, including player name, associated team, and optional minute
- **Klasemen**: The standings table showing team rankings within a group
- **Jadwal**: The schedule view showing all 12 matches with their statuses
- **Match_Status**: One of three states: "Upcoming" (not yet played), "Live" (in progress), or "Selesai" (completed)
- **Match_Order**: A numeric field indicating the chronological position of a match in the schedule
- **Storage_Manager**: The component responsible for reading and writing data to localStorage
- **Standings_Calculator**: The component responsible for computing team rankings from match results
- **Match_Form**: The user interface component for inputting and editing match data
- **Backup_File**: A JSON file containing exported tournament data

## Requirements

### Requirement 1: Match Score Input

**User Story:** As an Organizer, I want to input match scores with scorer details, so that match results are recorded quickly at the field.

#### Acceptance Criteria

1. WHEN the Organizer opens the Match_Form, THE Application SHALL display fields for group selection, home team selection, away team selection, home score, away score, and match status selection with options "Upcoming", "Live", and "Selesai".
2. WHEN the Organizer selects a Group, THE Match_Form SHALL filter the team dropdowns to display only teams belonging to the selected Group.
3. WHEN the Organizer submits a match with valid data, THE Storage_Manager SHALL persist the match data to localStorage within 1 second.
4. IF the Organizer selects the same team for both home and away, THEN THE Match_Form SHALL display a validation error indicating the two teams must be different and prevent submission.
5. IF the Organizer enters a score value that is not a whole number in the range 0 to 99, THEN THE Match_Form SHALL display a validation error indicating the valid score range and prevent submission.
6. WHEN the Organizer submits a match, THE Match_Form SHALL reset all fields to their default state: group unselected, team dropdowns empty, scores set to 0, and status set to "Upcoming".
7. WHEN the Organizer submits a match, THE Application SHALL display a success confirmation message for 3 seconds.
8. IF the Organizer attempts to submit a match with the same home team and away team pairing that already exists in the selected Group, THEN THE Match_Form SHALL display a validation error indicating the match already exists and prevent submission.

### Requirement 2: Scorer Tracking

**User Story:** As an Organizer, I want to record which players scored goals and when, so that I can track individual goal contributions per match.

#### Acceptance Criteria

1. WHEN the Organizer adds a scorer entry, THE Match_Form SHALL capture the player name (required, 1–50 characters, whitespace-only not accepted), associated team (required, must be one of the two teams in that match), goal count (required, default 1, minimum 1, maximum 20), and minute (optional, integer between 1 and 200 inclusive).
2. WHEN the Organizer adds multiple scorer entries to a match, THE Application SHALL store up to 30 scorer entries associated with that match.
3. WHEN the Organizer views a completed match, THE Application SHALL display all scorer entries with player name, team, goal count, and minute (if recorded).
4. THE Application SHALL allow scorer total goals to differ from the match score without enforcing strict validation.
5. WHEN the Organizer removes a scorer entry from a match, THE Application SHALL delete that scorer record and remove it from the displayed scorer list immediately.
6. IF the Organizer submits a scorer entry with a player name that is empty or contains only whitespace, THEN THE Match_Form SHALL reject the submission and display an error message indicating that a valid player name is required.

### Requirement 3: Standings Calculation (Klasemen)

**User Story:** As an Organizer, I want standings to be calculated automatically, so that I can instantly see the correct rankings after inputting a match.

#### Acceptance Criteria

1. WHEN a match with status "Selesai" is saved, THE Standings_Calculator SHALL recalculate the klasemen for the affected Group within 2 seconds of the save action completing.
2. THE Standings_Calculator SHALL compute the following statistics for each team using only matches with status "Selesai" in that team's group: Matches Played (M), Wins (W), Draws (D), Losses (L), Goals For (GF), Goals Against (GA), Goal Difference (GD = GF minus GA), and Points.
3. THE Standings_Calculator SHALL assign 3 points for a win, 1 point for a draw, and 0 points for a loss.
4. THE Standings_Calculator SHALL sort teams by Points descending, then by Goal Difference descending, then by Goals For descending; IF two or more teams remain equal on all three criteria, THEN THE Standings_Calculator SHALL rank those teams in alphabetical order by team name.
5. THE Application SHALL display separate klasemen tables for Group A and Group B, each showing exactly 4 team rows with columns: Rank, Team Name, M, W, D, L, GF, GA, GD, and Points.
6. WHEN a match is edited, deleted, or its status is changed from "Selesai" to another status, THE Standings_Calculator SHALL recalculate the klasemen for the affected Group so that only current "Selesai" matches contribute to the standings.
7. IF no matches with status "Selesai" exist for a group, THEN THE Standings_Calculator SHALL display all teams in that group with zero values for all statistics (M, W, D, L, GF, GA, GD, and Points), sorted alphabetically by team name.

### Requirement 4: Schedule and Results View (Jadwal)

**User Story:** As an Organizer, I want to see all 12 matches in a clear timeline, so that I can track which matches are upcoming, live, or completed.

#### Acceptance Criteria

1. THE Application SHALL display all 12 matches in the Jadwal view, grouped by their assigned group (Grup A, Grup B).
2. THE Application SHALL display a Match_Status badge ("Upcoming", "Live", or "Selesai") on each match card, where "Live" includes a visually distinct indicator (e.g., pulsing dot or contrasting color) to differentiate it from other statuses.
3. WHEN a match has status "Selesai", THE Application SHALL display the final score (scoreHome and scoreAway) on the match card between the two team names.
4. WHEN a match has status "Upcoming", THE Application SHALL display "vs" between the team names without a score.
5. WHEN a match has status "Live", THE Application SHALL display the current score (scoreHome and scoreAway) on the match card between the two team names.
6. THE Application SHALL sort matches in the Jadwal view by Match_Order for chronological display.
7. WHEN the Organizer taps a completed match card, THE Application SHALL expand the card to show scorer details including each scorer's player name, the team they scored for, the number of goals scored, and the minute of each goal (if recorded).
8. WHEN the Organizer selects a group filter (Grup A or Grup B), THE Application SHALL display only the matches belonging to the selected group.
9. WHEN no group filter is selected, THE Application SHALL display all 12 matches across both groups.

### Requirement 5: Match Status Management

**User Story:** As an Organizer, I want to manually set the match status, so that I can indicate which match is currently being played.

#### Acceptance Criteria

1. WHEN the Organizer creates a new match, THE Match_Form SHALL default the Match_Status selection to "Upcoming".
2. WHEN the Organizer creates or edits a match, THE Match_Form SHALL allow selection of Match_Status as one of exactly three options: "Upcoming", "Live", or "Selesai".
3. WHEN the Organizer saves a match with a status of "Live", THE Application SHALL display that match with a "Live" badge in the Jadwal view, AND display matches with status "Upcoming" with an "Upcoming" badge, AND display matches with status "Selesai" with a "Selesai" badge.
4. THE Application SHALL allow the Organizer to change Match_Status from any state to any other state without restriction, including allowing more than one match to have "Live" status simultaneously.
5. WHEN the Organizer changes a Match_Status, THE Application SHALL persist the updated status to localStorage within 1 second and reflect the new badge in the Jadwal view without requiring a page refresh.

### Requirement 6: Edit and Delete Match

**User Story:** As an Organizer, I want to edit or delete previously recorded matches, so that I can correct mistakes or cancel matches.

#### Acceptance Criteria

1. WHEN the Organizer selects edit on a match, THE Application SHALL populate the Match_Form with the existing match data including scores, scorers, and current status.
2. WHEN the Organizer submits edited match data, THE Storage_Manager SHALL overwrite the previous match record with the updated data and persist to localStorage within 1 second.
3. WHEN the Organizer submits edited match data, THE same validation rules from Requirement 1 SHALL apply (score range 0-99, teams must differ).
4. WHEN the Organizer deletes a match, THE Application SHALL reset the match to status "Upcoming" with scoreHome and scoreAway set to 0 and all scorers removed.
5. WHEN the Organizer deletes a match, THE Standings_Calculator SHALL recalculate the klasemen for the affected Group.
6. WHEN the Organizer attempts to delete a match, THE Application SHALL display a confirmation prompt before executing the deletion.
7. IF the Organizer cancels the deletion confirmation prompt, THEN THE Application SHALL retain the match data unchanged.

### Requirement 7: Data Persistence

**User Story:** As an Organizer, I want my data to persist across browser sessions, so that I do not lose tournament data when closing the app.

#### Acceptance Criteria

1. WHEN a match is created, updated, or deleted, THE Storage_Manager SHALL save the complete application state (all matches, scores, scorers, and match statuses) to localStorage within 1 second of the change.
2. WHEN the Application starts, THE Storage_Manager SHALL load previously saved data from localStorage and restore all matches, scores, scorers, and match statuses before the UI becomes interactive.
3. IF localStorage contains data that fails JSON parsing or does not conform to the expected data structure (missing required fields, invalid field types, or unrecognized status values), THEN THE Storage_Manager SHALL discard the corrupted data, initialize the application with the default empty state (pre-configured teams, no match results), and display a notification to the user indicating that saved data could not be restored.
4. IF a localStorage write operation fails (due to quota exceeded or browser restriction), THEN THE Storage_Manager SHALL display a notification to the user indicating that data could not be saved and retain the current in-memory state without crashing.
5. THE Storage_Manager SHALL store all tournament data (matches, scores, scorers, match statuses, and team assignments) as a single JSON entry in localStorage with a maximum serialized size of 1 MB.

### Requirement 8: Data Export and Import

**User Story:** As an Organizer, I want to export and import tournament data as a JSON file, so that I can create backups and restore data if needed.

#### Acceptance Criteria

1. WHEN the Organizer triggers a data export, THE Application SHALL generate a Backup_File in JSON format containing all Teams data and all Matches data (including scorers) stored in the Storage_Manager.
2. WHEN the Organizer triggers a data export, THE Application SHALL download the Backup_File to the Organizer's device with a filename that includes a timestamp indicating when the export was generated.
3. WHEN the Organizer selects a Backup_File for import, THE Application SHALL display a confirmation prompt warning that importing will overwrite all existing data.
4. WHEN the Organizer confirms the import of a valid Backup_File, THE Storage_Manager SHALL replace all current Teams and Matches data with the data from the imported file.
5. IF the Organizer cancels the import confirmation prompt, THEN THE Application SHALL retain all existing data unchanged and return to the previous view.
6. IF the Organizer imports a Backup_File that is not valid JSON or does not contain the required Teams and Matches data structures, THEN THE Application SHALL display an error message indicating the file is invalid and retain all existing data unchanged.
7. WHEN the Storage_Manager completes a successful data import, THE Application SHALL refresh all views (Klasemen, Jadwal) to reflect the imported data.

### Requirement 9: Reset All Data

**User Story:** As an Organizer, I want to reset all tournament data to a fresh state, so that I can start over if needed.

#### Acceptance Criteria

1. WHEN the Organizer triggers a data reset, THE Application SHALL display a confirmation prompt with a clear warning that all match scores, scorers, and statuses will be permanently erased.
2. IF the Organizer cancels the reset confirmation prompt, THEN THE Application SHALL retain all existing data unchanged.
3. WHEN the Organizer confirms the data reset, THE Storage_Manager SHALL clear all match scores, scorers, and statuses, resetting all 12 matches to "Upcoming" status with scoreHome and scoreAway set to 0.
4. WHEN the data reset completes, THE Standings_Calculator SHALL recalculate all klasemen to reflect zero matches played, displaying all teams with zero statistics.
5. WHEN the data reset completes, THE Application SHALL retain all pre-configured teams and match slot structures (the 12 round-robin pairings remain intact).

### Requirement 10: PWA and Offline Support

**User Story:** As an Organizer, I want the application to be installable and work offline, so that I can use it at the field without reliable internet.

#### Acceptance Criteria

1. THE Application SHALL serve a web app manifest that includes the application name, icons in both 192x192 and 512x512 pixel sizes, a theme color, a display mode of "standalone", and a start URL, such that the manifest passes the browser's installability checks.
2. THE Application SHALL register a service worker that precaches all HTML, CSS, JavaScript, and static image assets required to render and operate the application without a network connection.
3. WHEN the device has no internet connection after the service worker has been activated from a prior online visit, THE Application SHALL allow the user to view standings, view the schedule, input match scores, and manage scorer details with all data persisted to localStorage, with no feature degradation compared to online usage.
4. THE Application SHALL be installable on mobile devices via the browser's "Add to Home Screen" prompt, launching in standalone display mode without browser chrome.
5. WHILE the device has no internet connection, THE Application SHALL display a visible offline indicator so the user knows the current connectivity state.

### Requirement 11: Pre-configured Teams

**User Story:** As an Organizer, I want all 8 teams to be pre-configured in the application, so that I do not need to manually add teams before the tournament.

#### Acceptance Criteria

1. THE Application SHALL contain 8 pre-configured teams: 4 teams assigned to Group A and 4 teams assigned to Group B, where each team has a unique identifier, a display name, and a group assignment.
2. THE Application SHALL pre-generate all 12 round-robin match slots (6 per group) at initialization with status "Upcoming", ensuring each team is paired against every other team in the same group exactly once.
3. THE Application SHALL assign a unique sequential Match_Order integer value (1 through 12) to each pre-generated match for chronological sorting.
4. IF the Application is initialized and pre-configured teams and match slots already exist in storage, THEN THE Application SHALL retain the existing data without creating duplicate teams or match slots.

### Requirement 12: Mobile-First Responsive Design

**User Story:** As an Organizer, I want the application to be usable on a smartphone, so that I can input scores quickly at the field.

#### Acceptance Criteria

1. THE Application SHALL render all UI elements without horizontal overflow on viewports 375 pixels wide and above.
2. WHILE the viewport is narrower than 768 pixels, THE Application SHALL display the klasemen table in a horizontally scrollable container.
3. WHILE the viewport is narrower than 768 pixels, THE Application SHALL display form inputs at full width.
4. THE Application SHALL provide tab-based navigation between Klasemen, Jadwal, and Input Match views, positioned at the bottom of the screen on viewports narrower than 768 pixels for one-handed access.
5. THE Application SHALL ensure all interactive elements (buttons, links, tab items) have a minimum touch target size of 44x44 CSS pixels.
6. THE Application SHALL render text input fields with a minimum font size of 16 pixels to prevent automatic zoom on iOS devices.
