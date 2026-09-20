package com.healthsync.userservice.config;

import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.env.Environment;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DataSourceConfig {

    private final Environment env;

    public DataSourceConfig(Environment env) {
        this.env = env;
    }

    @Bean
    @Primary
    public DataSource dataSource() {
        String dbUrl = env.getProperty("DATABASE_URL");
        if (dbUrl == null || dbUrl.isBlank()) {
            dbUrl = env.getProperty("SPRING_DATASOURCE_URL");
        }

        if (dbUrl != null && !dbUrl.isBlank()) {
            String clean = dbUrl.trim();
            // If it contains user:password@ or is postgresql
            if (clean.contains("@") || clean.startsWith("postgres://") || clean.startsWith("postgresql://") || clean.startsWith("jdbc:postgresql://")) {
                try {
                    String httpFormat = clean;
                    if (httpFormat.startsWith("jdbc:")) {
                        httpFormat = httpFormat.substring(5);
                    }
                    if (httpFormat.startsWith("postgres://")) {
                        httpFormat = "http://" + httpFormat.substring("postgres://".length());
                    } else if (httpFormat.startsWith("postgresql://")) {
                        httpFormat = "http://" + httpFormat.substring("postgresql://".length());
                    }

                    URI uri = new URI(httpFormat);
                    String userInfo = uri.getUserInfo();
                    String username = env.getProperty("SPRING_DATASOURCE_USERNAME", "");
                    String password = env.getProperty("SPRING_DATASOURCE_PASSWORD", "");

                    if (userInfo != null && userInfo.contains(":")) {
                        String[] parts = userInfo.split(":", 2);
                        username = parts[0];
                        password = parts[1];
                    }

                    int port = uri.getPort() == -1 ? 5432 : uri.getPort();
                    String jdbcUrl = "jdbc:postgresql://" + uri.getHost() + ":" + port + uri.getPath();

                    return DataSourceBuilder.create()
                            .driverClassName("org.postgresql.Driver")
                            .url(jdbcUrl)
                            .username(username)
                            .password(password)
                            .build();
                } catch (Exception ignored) {
                }
            }
        }

        String defaultUrl = env.getProperty("spring.datasource.url", "jdbc:oracle:thin:@localhost:1521:XE");
        String defaultDriver = env.getProperty("spring.datasource.driverClassName", "oracle.jdbc.OracleDriver");
        String defaultUser = env.getProperty("spring.datasource.username", "system");
        String defaultPass = env.getProperty("spring.datasource.password", "naani123");

        return DataSourceBuilder.create()
                .driverClassName(defaultDriver)
                .url(defaultUrl)
                .username(defaultUser)
                .password(defaultPass)
                .build();
    }
}
