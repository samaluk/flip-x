import type { AppError } from "./domain";

export function getAppErrorMessage(error: AppError): string {
  switch (error._tag) {
    case "MatchNotFound":
      return "Match not found.";
    case "InvalidTurn":
      return "It is not your turn.";
    case "InvalidAction":
      return "That action is not valid right now.";
    case "InvalidTarget":
      return "That target is not valid.";
    case "InvalidHostName":
      return "Enter a valid host name.";
    case "LobbyCodeUnavailable":
      return "A lobby code could not be created. Try again.";
    case "LobbyNotFound":
      return "Lobby not found.";
    case "InvalidPlayerName":
      return "Enter a valid player name.";
    case "NameAlreadyTaken":
      return "That player name is already taken.";
    case "InvalidPlayerColor":
      return "Choose a valid player color.";
    case "PlayerColorAlreadyTaken":
      return "That player color is already taken.";
    case "NotHost":
      return "Only the host can do that.";
    case "InsufficientPlayers":
      return `At least ${error.minPlayers} players are required.`;
    case "PlayerNotJoined":
      return "Join the match before doing that.";
    case "RateLimited":
      return "Too many attempts. Try again later.";
    case "InvalidMatchState":
      return "The match is not in the right state for that action.";
    case "StaleGameState":
      return "The game changed. Refresh and try again.";
    case "UnsupportedRelationship":
      return "Unsupported relationship.";
    case "UnsupportedTable":
      return "Unsupported table.";
    case "InvalidConfirmation":
      return "Invalid confirmation.";
    default: {
      const exhaustive: never = error;
      return exhaustive;
    }
  }
}
