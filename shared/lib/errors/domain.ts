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

export class InvalidHostName extends Schema.TaggedError<InvalidHostName>()("InvalidHostName", {
  message: Schema.String,
}) {}

export const invalidHostName = (): InvalidHostName =>
  new InvalidHostName({ message: W.InvalidHostName });

export class InvalidGameSettings extends Schema.TaggedError<InvalidGameSettings>()(
  "InvalidGameSettings",
  { message: Schema.String },
) {}

export const invalidGameSettings = (): InvalidGameSettings =>
  new InvalidGameSettings({ message: W.InvalidGameSettings });

export class LobbyCodeUnavailable extends Schema.TaggedError<LobbyCodeUnavailable>()(
  "LobbyCodeUnavailable",
  { message: Schema.String },
) {}

export const lobbyCodeUnavailable = (): LobbyCodeUnavailable =>
  new LobbyCodeUnavailable({ message: W.LobbyCodeUnavailable });

export class LobbyNotFound extends Schema.TaggedError<LobbyNotFound>()("LobbyNotFound", {
  message: Schema.String,
}) {}

export const lobbyNotFound = (): LobbyNotFound => new LobbyNotFound({ message: W.LobbyNotFound });

export class InvalidPlayerName extends Schema.TaggedError<InvalidPlayerName>()(
  "InvalidPlayerName",
  { message: Schema.String },
) {}

export const invalidPlayerName = (): InvalidPlayerName =>
  new InvalidPlayerName({ message: W.InvalidPlayerName });

export class NameAlreadyTaken extends Schema.TaggedError<NameAlreadyTaken>()("NameAlreadyTaken", {
  name: Schema.String,
  message: Schema.String,
}) {}

export const nameAlreadyTaken = (fields: { name: string }): NameAlreadyTaken =>
  new NameAlreadyTaken({ ...fields, message: W.NameAlreadyTaken });

export class InvalidPlayerColor extends Schema.TaggedError<InvalidPlayerColor>()(
  "InvalidPlayerColor",
  { colorId: Schema.String, message: Schema.String },
) {}

export const invalidPlayerColor = (fields: { colorId: string }): InvalidPlayerColor =>
  new InvalidPlayerColor({ ...fields, message: W.InvalidPlayerColor });

export class PlayerColorAlreadyTaken extends Schema.TaggedError<PlayerColorAlreadyTaken>()(
  "PlayerColorAlreadyTaken",
  { colorId: Schema.String, message: Schema.String },
) {}

export const playerColorAlreadyTaken = (fields: { colorId: string }): PlayerColorAlreadyTaken =>
  new PlayerColorAlreadyTaken({ ...fields, message: W.PlayerColorAlreadyTaken });

export class NotHost extends Schema.TaggedError<NotHost>()("NotHost", { message: Schema.String }) {}

export const notHost = (): NotHost => new NotHost({ message: W.NotHost });

export class InsufficientPlayers extends Schema.TaggedError<InsufficientPlayers>()(
  "InsufficientPlayers",
  { minPlayers: Schema.Number, message: Schema.String },
) {}

export const insufficientPlayers = (fields: { minPlayers: number }): InsufficientPlayers =>
  new InsufficientPlayers({ ...fields, message: W.InsufficientPlayers });

export class PlayerNotJoined extends Schema.TaggedError<PlayerNotJoined>()("PlayerNotJoined", {
  message: Schema.String,
}) {}

export const playerNotJoined = (): PlayerNotJoined =>
  new PlayerNotJoined({ message: W.PlayerNotJoined });

export class RateLimited extends Schema.TaggedError<RateLimited>()("RateLimited", {
  message: Schema.String,
}) {}

export const rateLimited = (): RateLimited => new RateLimited({ message: W.RateLimited });

export class InvalidMatchState extends Schema.TaggedError<InvalidMatchState>()(
  "InvalidMatchState",
  { message: Schema.String },
) {}

export const invalidMatchState = (): InvalidMatchState =>
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

export class UnsupportedRelationship extends Schema.TaggedError<UnsupportedRelationship>()(
  "UnsupportedRelationship",
  { message: Schema.String },
) {}

export const unsupportedRelationship = (): UnsupportedRelationship =>
  new UnsupportedRelationship({ message: W.UnsupportedRelationship });

export class UnsupportedTable extends Schema.TaggedError<UnsupportedTable>()("UnsupportedTable", {
  table: Schema.String,
  id: Schema.String,
  message: Schema.String,
}) {}

export const unsupportedTable = (fields: { table: string; id: string }): UnsupportedTable =>
  new UnsupportedTable({ ...fields, message: W.UnsupportedTable });

export class InvalidConfirmation extends Schema.TaggedError<InvalidConfirmation>()(
  "InvalidConfirmation",
  { message: Schema.String },
) {}

export const invalidConfirmation = (): InvalidConfirmation =>
  new InvalidConfirmation({ message: W.InvalidConfirmation });

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
