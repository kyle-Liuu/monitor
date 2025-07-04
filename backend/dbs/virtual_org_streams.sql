CREATE TABLE virtual_org_streams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    virtual_org_id INT NOT NULL,
    stream_id INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (virtual_org_id) REFERENCES virtual_organizations (id) ON DELETE CASCADE,
    FOREIGN KEY (stream_id) REFERENCES video_streams (id) ON DELETE CASCADE,
    UNIQUE KEY unique_virtual_org_stream (virtual_org_id, stream_id)
);