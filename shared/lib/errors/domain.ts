import * as Schema from "effect/Schema";
import * as Effect from "effect/Effect";

import { APP_ERROR_WIRE_CODE as W } from "./app-error-wire-code";

export class MatchNotFound extends Schema.TaggedError<MatchNotFound>()("MatchNotFound", {
  matchId: Schema.String,
  message: Schema.String,
}) {}

export const matchNotFound = (fields: { matchId: string }): MatchNotFound =>
  new MatchNotFound({ ...fields, message: W.MatchNotFound });

export class InvalidTurn extends Schema.TaggedError<InvalidTurn>()("InvalidTurn", {
  message: Schema.String,
}) {}

export const invalidTurn = (): InvalidTurn => new InvalidTurn({ message: W.InvalidTurn });

export class InvalidAction extends Schema.TaggedError<InvalidAction>()("InvalidAction", {
  message: Schema.String,
}) {}

export const invalidAction = (): InvalidAction => new InvalidAction({ message: W.InvalidAction });

export class InvalidTarget extends Schema.TaggedError<InvalidTarget>()("InvalidTarget", {
  message: Schema.String,
}) {}

export const invalidTarget = (): InvalidTarget => new InvalidTarget({ message: W.InvalidTarget });

class InvalidHostName extends Schema.TaggedError<InvalidHostName>()("InvalidHostName", {
  message: Schema.String,
}) {}

export const invalidHostName = (): AppError => new InvalidHostName({ message: W.InvalidHostName });

class InvalidGameSettings extends Schema.TaggedError<InvalidGameSettings>()("InvalidGameSettings", {
  message: Schema.String,
}) {}

export const invalidGameSettings = (): AppError =>
  new InvalidGameSettings({ message: W.InvalidGameSettings });

class LobbyCodeUnavailable extends Schema.TaggedError<LobbyCodeUnavailable>()(
  "LobbyCodeUnavailable",
  { message: Schema.String },
) {}

export const lobbyCodeUnavailable = (): AppError =>
  new LobbyCodeUnavailable({ message: W.LobbyCodeUnavailable });

class LobbyNotFound extends Schema.TaggedError<LobbyNotFound>()("LobbyNotFound", {
  message: Schema.String,
}) {}

export const lobbyNotFound = (): AppError => new LobbyNotFound({ message: W.LobbyNotFound });

class InvalidPlayerName extends Schema.TaggedError<InvalidPlayerName>()("InvalidPlayerName", {
  message: Schema.String,
}) {}

export const invalidPlayerName = (): AppError =>
  new InvalidPlayerName({ message: W.InvalidPlayerName });

class NameAlreadyTaken extends Schema.TaggedError<NameAlreadyTaken>()("NameAlreadyTaken", {
  name: Schema.String,
  message: Schema.String,
}) {}

export const nameAlreadyTaken = (fields: { name: string }): AppError =>
  new NameAlreadyTaken({ ...fields, message: W.NameAlreadyTaken });

class InvalidPlayerColor extends Schema.TaggedError<InvalidPlayerColor>()("InvalidPlayerColor", {
  colorId: Schema.String,
  message: Schema.String,
}) {}

export const invalidPlayerColor = (fields: { colorId: string }): AppError =>
  new InvalidPlayerColor({ ...fields, message: W.InvalidPlayerColor });

class PlayerColorAlreadyTaken extends Schema.TaggedError<PlayerColorAlreadyTaken>()(
  "PlayerColorAlreadyTaken",
  { colorId: Schema.String, message: Schema.String },
) {}

export const playerColorAlreadyTaken = (fields: { colorId: string }): AppError =>
  new PlayerColorAlreadyTaken({ ...fields, message: W.PlayerColorAlreadyTaken });

class NotHost extends Schema.TaggedError<NotHost>()("NotHost", { message: Schema.String }) {}

export const notHost = (): AppError => new NotHost({ message: W.NotHost });

class InsufficientPlayers extends Schema.TaggedError<InsufficientPlayers>()("InsufficientPlayers", {
  minPlayers: Schema.Number,
  message: Schema.String,
}) {}

export const insufficientPlayers = (fields: { minPlayers: number }): AppError =>
  new InsufficientPlayers({ ...fields, message: W.InsufficientPlayers });

class PlayerNotJoined extends Schema.TaggedError<PlayerNotJoined>()("PlayerNotJoined", {
  message: Schema.String,
}) {}

export const playerNotJoined = (): AppError => new PlayerNotJoined({ message: W.PlayerNotJoined });

class RateLimited extends Schema.TaggedError<RateLimited>()("RateLimited", {
  message: Schema.String,
}) {}

export const rateLimited = (): AppError => new RateLimited({ message: W.RateLimited });

class InvalidMatchState extends Schema.TaggedError<InvalidMatchState>()("InvalidMatchState", {
  message: Schema.String,
}) {}

export const invalidMatchState = (): AppError =>
  new InvalidMatchState({ message: W.InvalidMatchState });

export class StaleGameState extends Schema.TaggedError<StaleGameState>()("StaleGameState", {
  expectedVersion: Schema.Number,
  actualVersion: Schema.Number,
  message: Schema.String,
}) {}

export const staleGameState = (fields: {
  expectedVersion: number;
  actualVersion: number;
}): StaleGameState => new StaleGameState({ ...fields, message: W.StaleGameState });

class UnsupportedRelationship extends Schema.TaggedError<UnsupportedRelationship>()(
  "UnsupportedRelationship",
  { message: Schema.String },
) {}

export const unsupportedRelationship = (): AppError =>
  new UnsupportedRelationship({ message: W.UnsupportedRelationship });

class UnsupportedTable extends Schema.TaggedError<UnsupportedTable>()("UnsupportedTable", {
  table: Schema.String,
  id: Schema.String,
  message: Schema.String,
}) {}

export const unsupportedTable = (fields: { table: string; id: string }): AppError =>
  new UnsupportedTable({ ...fields, message: W.UnsupportedTable });

export class InvalidConfirmation extends Schema.TaggedError<InvalidConfirmation>()(
  "InvalidConfirmation",
  { message: Schema.String },
) {}

export const AppErrorSchema = Schema.Union(
  MatchNotFound,
  InvalidTurn,
  InvalidAction,
  InvalidTarget,
  InvalidHostName,
  InvalidGameSettings,
  LobbyCodeUnavailable,
  LobbyNotFound,
  InvalidPlayerName,
  NameAlreadyTaken,
  InvalidPlayerColor,
  PlayerColorAlreadyTaken,
  NotHost,
  InsufficientPlayers,
  PlayerNotJoined,
  RateLimited,
  InvalidMatchState,
  StaleGameState,
  UnsupportedRelationship,
  UnsupportedTable,
  InvalidConfirmation,
);

export type AppError = Schema.Schema.Type<typeof AppErrorSchema>;

const isAppError = Schema.is(AppErrorSchema);

export function retainAppErrors<A, E, R>(
  effect: Effect.Effect<A, E, R>,
): Effect.Effect<A, AppError, R> {
  return effect.pipe(
    Effect.catchAll((error) => (isAppError(error) ? Effect.fail(error) : Effect.die(error))),
  );
}

export function appErrorWireCode(error: AppError): string {
  return error.message;
}
