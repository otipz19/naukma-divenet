package ua.ukma.divenet.divelog.service;

/** A dive was logged or edited; an edit can change the user's deepest dive or sites. */
public record DiveLogged(long userId) {}
