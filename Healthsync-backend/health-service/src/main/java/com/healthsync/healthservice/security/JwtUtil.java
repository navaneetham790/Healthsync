package com.healthsync.healthservice.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.security.Key;

@Component
public class JwtUtil {
    @Value("${jwt.secret}") private String secret;
    private Key key() { return Keys.hmacShaKeyFor(secret.getBytes()); }
    private Claims claims(String token) { return Jwts.parserBuilder().setSigningKey(key()).build().parseClaimsJws(token).getBody(); }
    public String email(String token) { return claims(token).getSubject(); }
    public String role(String token) { return claims(token).get("role", String.class); }
    public Long id(String token) {
        Object value = claims(token).get("id");
        return value instanceof Number ? ((Number) value).longValue() : (value == null ? null : Long.valueOf(value.toString()));
    }
}
