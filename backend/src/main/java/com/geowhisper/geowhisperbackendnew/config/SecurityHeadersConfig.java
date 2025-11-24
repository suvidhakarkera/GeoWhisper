package com.geowhisper.geowhisperbackendnew.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;

import java.io.IOException;

/**
 * Security Headers Configuration
 * 
 * Configures HTTP security headers to allow OAuth popup authentication
 * while maintaining reasonable security posture.
 * 
 * Key headers:
 * - Cross-Origin-Opener-Policy: same-origin-allow-popups (allows OAuth popups)
 * - Cross-Origin-Embedder-Policy: unsafe-none (allows embedding resources)
 * - Cross-Origin-Resource-Policy: cross-origin (allows cross-origin requests)
 */
@Configuration
@Order(Ordered.HIGHEST_PRECEDENCE)
public class SecurityHeadersConfig implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        
        // Allow popups to communicate with parent window for OAuth flows
        // This is required for Google Sign-In popup authentication
        httpResponse.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
        
        // Allow embedding of cross-origin resources
        httpResponse.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
        
        // Allow cross-origin resource sharing
        httpResponse.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
        
        // Security headers for additional protection
        httpResponse.setHeader("X-Content-Type-Options", "nosniff");
        httpResponse.setHeader("X-Frame-Options", "SAMEORIGIN");
        httpResponse.setHeader("X-XSS-Protection", "1; mode=block");
        
        chain.doFilter(request, response);
    }

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        // Initialization logic if needed
    }

    @Override
    public void destroy() {
        // Cleanup logic if needed
    }
}
