package com.xiaoyouyingyu.service;

import com.xiaoyouyingyu.entity.User;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PcWechatLoginService {
    private static final long EXPIRE_MINUTES = 5;

    private final SecureRandom secureRandom = new SecureRandom();
    private final Map<String, LoginTicket> tickets = new ConcurrentHashMap<>();

    public SessionCreationResult createSession(String userAgent, String clientIp) {
        cleanupExpired();
        String ticketId = randomToken(24);
        String pollToken = randomToken(32);
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(EXPIRE_MINUTES);
        LoginTicket ticket = new LoginTicket(ticketId, pollToken, expiresAt, userAgent, clientIp);
        tickets.put(ticketId, ticket);
        String qrContent = "xiaoyouyingyu://pc-login?ticket=" + ticketId;
        return new SessionCreationResult(ticketId, pollToken, expiresAt, qrContent);
    }

    public Optional<LoginTicket> getScene(String ticketId) {
        cleanupExpired();
        LoginTicket ticket = tickets.get(ticketId);
        if (ticket == null) {
            return Optional.empty();
        }
        return Optional.of(ticket);
    }

    public PollResult poll(String ticketId, String pollToken) {
        cleanupExpired();
        LoginTicket ticket = tickets.get(ticketId);
        if (ticket == null || !ticket.getPollToken().equals(pollToken)) {
            return new PollResult(PollStatus.INVALID, null);
        }
        if (ticket.isExpired()) {
            ticket.setStatus(TicketStatus.EXPIRED);
            return new PollResult(PollStatus.EXPIRED, null);
        }
        if (ticket.getStatus() == TicketStatus.CONFIRMED) {
            ticket.setStatus(TicketStatus.CONSUMED);
            ticket.setConsumedAt(LocalDateTime.now());
            return new PollResult(PollStatus.CONFIRMED, ticket.getUser());
        }
        if (ticket.getStatus() == TicketStatus.CONSUMED) {
            return new PollResult(PollStatus.CONSUMED, null);
        }
        if (ticket.getStatus() == TicketStatus.CANCELLED) {
            return new PollResult(PollStatus.CANCELLED, null);
        }
        return new PollResult(PollStatus.PENDING, null);
    }

    public TicketActionResult confirm(String ticketId, User user) {
        cleanupExpired();
        LoginTicket ticket = tickets.get(ticketId);
        if (ticket == null) {
            return TicketActionResult.invalid();
        }
        if (ticket.isExpired()) {
            ticket.setStatus(TicketStatus.EXPIRED);
            return TicketActionResult.expired();
        }
        if (ticket.getStatus() == TicketStatus.CANCELLED) {
            return TicketActionResult.cancelled();
        }
        if (ticket.getStatus() == TicketStatus.CONSUMED) {
            return TicketActionResult.consumed();
        }
        ticket.setStatus(TicketStatus.CONFIRMED);
        ticket.setUser(user);
        ticket.setConfirmedAt(LocalDateTime.now());
        return TicketActionResult.success(ticket);
    }

    public TicketActionResult cancel(String ticketId) {
        cleanupExpired();
        LoginTicket ticket = tickets.get(ticketId);
        if (ticket == null) {
            return TicketActionResult.invalid();
        }
        if (ticket.isExpired()) {
            ticket.setStatus(TicketStatus.EXPIRED);
            return TicketActionResult.expired();
        }
        if (ticket.getStatus() == TicketStatus.CONSUMED) {
            return TicketActionResult.consumed();
        }
        if (ticket.getStatus() == TicketStatus.CONFIRMED) {
            return TicketActionResult.confirmed();
        }
        ticket.setStatus(TicketStatus.CANCELLED);
        return TicketActionResult.success(ticket);
    }

    public TicketActionResult cancelPending(String ticketId) {
        return cancel(ticketId);
    }

    private void cleanupExpired() {
        LocalDateTime now = LocalDateTime.now();
        tickets.values().forEach(ticket -> {
            if (ticket.getExpiresAt().isBefore(now) && ticket.getStatus() == TicketStatus.PENDING) {
                ticket.setStatus(TicketStatus.EXPIRED);
            }
        });
        tickets.entrySet().removeIf(entry -> entry.getValue().getExpiresAt().plusMinutes(10).isBefore(now));
    }

    private String randomToken(int byteLength) {
        byte[] bytes = new byte[byteLength];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public enum TicketStatus {
        PENDING,
        CONFIRMED,
        CANCELLED,
        EXPIRED,
        CONSUMED
    }

    public enum PollStatus {
        PENDING,
        CONFIRMED,
        CANCELLED,
        EXPIRED,
        CONSUMED,
        INVALID
    }

    public static class SessionCreationResult {
        private final String ticketId;
        private final String pollToken;
        private final LocalDateTime expiresAt;
        private final String qrContent;

        public SessionCreationResult(String ticketId, String pollToken, LocalDateTime expiresAt, String qrContent) {
            this.ticketId = ticketId;
            this.pollToken = pollToken;
            this.expiresAt = expiresAt;
            this.qrContent = qrContent;
        }

        public String getTicketId() {
            return ticketId;
        }

        public String getPollToken() {
            return pollToken;
        }

        public LocalDateTime getExpiresAt() {
            return expiresAt;
        }

        public String getQrContent() {
            return qrContent;
        }
    }

    public static class PollResult {
        private final PollStatus status;
        private final User user;

        public PollResult(PollStatus status, User user) {
            this.status = status;
            this.user = user;
        }

        public PollStatus getStatus() {
            return status;
        }

        public User getUser() {
            return user;
        }
    }

    public static class TicketActionResult {
        private final boolean success;
        private final String code;
        private final LoginTicket ticket;

        private TicketActionResult(boolean success, String code, LoginTicket ticket) {
            this.success = success;
            this.code = code;
            this.ticket = ticket;
        }

        public static TicketActionResult success(LoginTicket ticket) {
            return new TicketActionResult(true, "SUCCESS", ticket);
        }

        public static TicketActionResult invalid() {
            return new TicketActionResult(false, "INVALID", null);
        }

        public static TicketActionResult expired() {
            return new TicketActionResult(false, "EXPIRED", null);
        }

        public static TicketActionResult cancelled() {
            return new TicketActionResult(false, "CANCELLED", null);
        }

        public static TicketActionResult consumed() {
            return new TicketActionResult(false, "CONSUMED", null);
        }

        public static TicketActionResult confirmed() {
            return new TicketActionResult(false, "CONFIRMED", null);
        }

        public boolean isSuccess() {
            return success;
        }

        public String getCode() {
            return code;
        }

        public LoginTicket getTicket() {
            return ticket;
        }
    }

    public static class LoginTicket {
        private final String ticketId;
        private final String pollToken;
        private TicketStatus status;
        private User user;
        private final LocalDateTime expiresAt;
        private final String userAgent;
        private final String clientIp;
        private LocalDateTime confirmedAt;
        private LocalDateTime consumedAt;

        public LoginTicket(String ticketId, String pollToken, LocalDateTime expiresAt, String userAgent, String clientIp) {
            this.ticketId = ticketId;
            this.pollToken = pollToken;
            this.expiresAt = expiresAt;
            this.userAgent = userAgent;
            this.clientIp = clientIp;
            this.status = TicketStatus.PENDING;
        }

        public boolean isExpired() {
            return expiresAt.isBefore(LocalDateTime.now());
        }

        public String getTicketId() {
            return ticketId;
        }

        public String getPollToken() {
            return pollToken;
        }

        public TicketStatus getStatus() {
            return status;
        }

        public void setStatus(TicketStatus status) {
            this.status = status;
        }

        public User getUser() {
            return user;
        }

        public void setUser(User user) {
            this.user = user;
        }

        public LocalDateTime getExpiresAt() {
            return expiresAt;
        }

        public String getUserAgent() {
            return userAgent;
        }

        public String getClientIp() {
            return clientIp;
        }

        public LocalDateTime getConfirmedAt() {
            return confirmedAt;
        }

        public void setConfirmedAt(LocalDateTime confirmedAt) {
            this.confirmedAt = confirmedAt;
        }

        public LocalDateTime getConsumedAt() {
            return consumedAt;
        }

        public void setConsumedAt(LocalDateTime consumedAt) {
            this.consumedAt = consumedAt;
        }
    }
}
