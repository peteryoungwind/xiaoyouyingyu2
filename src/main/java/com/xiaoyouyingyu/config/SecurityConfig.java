package com.xiaoyouyingyu.config;

import com.xiaoyouyingyu.security.JwtFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    private final JwtFilter jwtFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf(c -> c.disable())
            .cors(c -> c.configurationSource(request -> {
                var cors = new CorsConfiguration();
                cors.setAllowedOrigins(List.of(
                        "http://localhost:3000",
                        "http://localhost:3001",
                        "https://xiaoyou-ky.top",
                        "http://xiaoyou-ky.top"
                ));
                cors.setAllowedMethods(List.of("*"));
                cors.setAllowedHeaders(List.of("*"));
                cors.setAllowCredentials(true);
                return cors;
            }))
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED))
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.POST, "/api/auth/register", "/api/auth/login", "/api/auth/wechat-login", "/api/auth/wechat-pc-login/session").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/auth/wechat-pc-login/session/*").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/topics").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/topics/calendar").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/topics/tags").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/topics/stats").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/topics/{id}").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/user/membership-contact").permitAll()
                .requestMatchers(HttpMethod.GET, "/uploads/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/learning/**").hasAnyRole("PREMIUM_USER", "ADMIN", "MEMBER")
                .requestMatchers("/api/word-practice/**").authenticated()
                .requestMatchers("/api/ai-dialog/**").authenticated()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
