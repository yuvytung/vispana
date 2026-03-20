package com.vispana.vespa.document;

import static org.springframework.http.MediaType.APPLICATION_JSON;

import java.nio.channels.UnresolvedAddressException;

import org.apache.commons.lang.exception.ExceptionUtils;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

@Component
public class VespaDocumentClient {

    private static final RestClient restClient = RestClient.create();

    String buildDocumentUrl(
            String containerHost, String namespace, String documentType, String documentId) {
        return containerHost
                + "/document/v1/"
                + namespace
                + "/"
                + documentType
                + "/docid/"
                + documentId;
    }

    public String postDocument(
            String containerHost,
            String namespace,
            String documentType,
            String documentId,
            String documentJson) {
        validateDocumentId(documentId);
        if (documentJson == null || documentJson.isEmpty()) {
            throw new RuntimeException("Document body must not be empty");
        }
        var url = buildDocumentUrl(containerHost, namespace, documentType, documentId);
        try {
            return restClient
                    .post()
                    .uri(url)
                    .contentType(APPLICATION_JSON)
                    .body(documentJson)
                    .retrieve()
                    .body(String.class);
        } catch (ResourceAccessException e) {
            throw handleResourceAccessException(e, containerHost);
        } catch (Exception e) {
            throw new RuntimeException("Error accessing Vespa Document API. " + e.getMessage(), e);
        }
    }

    public String deleteDocument(
            String containerHost, String namespace, String documentType, String documentId) {
        validateDocumentId(documentId);
        var url = buildDocumentUrl(containerHost, namespace, documentType, documentId);
        try {
            return restClient.delete().uri(url).retrieve().body(String.class);
        } catch (ResourceAccessException e) {
            throw handleResourceAccessException(e, containerHost);
        } catch (Exception e) {
            throw new RuntimeException("Error accessing Vespa Document API. " + e.getMessage(), e);
        }
    }

    public String getDocument(
            String containerHost, String namespace, String documentType, String documentId) {
        validateDocumentId(documentId);
        var url = buildDocumentUrl(containerHost, namespace, documentType, documentId);
        try {
            return restClient.get().uri(url).retrieve().body(String.class);
        } catch (ResourceAccessException e) {
            throw handleResourceAccessException(e, containerHost);
        } catch (Exception e) {
            throw new RuntimeException("Error accessing Vespa Document API. " + e.getMessage(), e);
        }
    }

    private void validateDocumentId(String documentId) {
        if (documentId == null || documentId.trim().isEmpty()) {
            throw new RuntimeException("Document ID must not be empty");
        }
    }

    private RuntimeException handleResourceAccessException(
            ResourceAccessException e, String containerHost) {
        var exception = ExceptionUtils.getRootCause(e);
        if (exception instanceof UnresolvedAddressException) {
            var message =
                    "Failed to reach to Vespa container for host: '"
                            + containerHost
                            + "'.\n"
                            + "Vespa clusters may have internal access to this address, please check if "
                            + "the host is reachable from Vispana. If not, you may configure a routing "
                            + "address in Vispana's configuration pointing to a reachable address (e.g"
                            + "., a load balancer or a k8s service).";
            return new RuntimeException(message);
        } else {
            throw e;
        }
    }
}
