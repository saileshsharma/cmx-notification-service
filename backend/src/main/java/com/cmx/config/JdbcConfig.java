package com.cmx.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.jdbc.core.convert.JdbcCustomConversions;
import org.springframework.data.jdbc.repository.config.AbstractJdbcConfiguration;

import java.sql.Timestamp;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Arrays;
import java.util.List;

@Configuration
public class JdbcConfig extends AbstractJdbcConfiguration {

    @Override
    public JdbcCustomConversions jdbcCustomConversions() {
        return new JdbcCustomConversions(customConverters());
    }

    private List<?> customConverters() {
        return Arrays.asList(
                new TimestampToOffsetDateTimeConverter(),
                new OffsetDateTimeToTimestampConverter()
        );
    }

    static class TimestampToOffsetDateTimeConverter implements Converter<Timestamp, OffsetDateTime> {
        @Override
        public OffsetDateTime convert(Timestamp source) {
            return source.toInstant().atOffset(ZoneOffset.UTC);
        }
    }

    static class OffsetDateTimeToTimestampConverter implements Converter<OffsetDateTime, Timestamp> {
        @Override
        public Timestamp convert(OffsetDateTime source) {
            return Timestamp.from(source.toInstant());
        }
    }
}
