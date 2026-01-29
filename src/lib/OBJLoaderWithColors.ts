import * as THREE from 'three';

/**
 * Custom OBJ loader that supports vertex colors from VoxelGrid exports.
 * 
 * VoxelGrid OBJ format:
 * - Vertices have embedded RGB colors: v x y z r g b
 * - Vertices and faces are interleaved (4 vertices, then 1 quad face, repeat)
 * - Face indices are 1-based and refer to global vertex array
 */
export class OBJLoaderWithColors {
  load(
    url: string,
    onLoad: (group: THREE.Group) => void,
    onProgress?: (event: ProgressEvent) => void,
    onError?: (error: unknown) => void
  ): void {
    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load ${url}: ${response.status}`);
        }
        return response.text();
      })
      .then((text) => {
        const result = this.parse(text);
        onLoad(result);
      })
      .catch((error) => {
        if (onError) {
          onError(error);
        } else {
          console.error(error);
        }
      });
  }

  parse(text: string): THREE.Group {
    const lines = text.split('\n');

    // Arrays to store all parsed vertices with their colors
    const allVertices: { x: number; y: number; z: number; r: number; g: number; b: number }[] = [];

    // Final geometry arrays
    const positions: number[] = [];
    const colors: number[] = [];

    // Parse OBJ file line by line
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('#') || trimmed === '') continue;

      const parts = trimmed.split(/\s+/);
      const keyword = parts[0];

      if (keyword === 'v') {
        // Vertex line: v x y z r g b
        const x = parseFloat(parts[1]);
        const y = parseFloat(parts[2]);
        const z = parseFloat(parts[3]);

        // Extract vertex colors (VoxelGrid format)
        let r = 1, g = 1, b = 1;
        if (parts.length >= 7) {
          r = parseFloat(parts[4]);
          g = parseFloat(parts[5]);
          b = parseFloat(parts[6]);
        }

        allVertices.push({ x, y, z, r, g, b });

      } else if (keyword === 'f') {
        // Face line: f v1 v2 v3 [v4...]
        // OBJ indices are 1-based
        const faceIndices: number[] = [];

        for (let i = 1; i < parts.length; i++) {
          // Handle formats: v, v/vt, v/vt/vn, v//vn
          const indexStr = parts[i].split('/')[0];
          const index = parseInt(indexStr, 10) - 1; // Convert to 0-based
          faceIndices.push(index);
        }

        // Triangulate the face (works for triangles and quads)
        // For a polygon with n vertices, create n-2 triangles using fan triangulation
        for (let i = 1; i < faceIndices.length - 1; i++) {
          const indices = [faceIndices[0], faceIndices[i], faceIndices[i + 1]];

          for (const idx of indices) {
            if (idx >= 0 && idx < allVertices.length) {
              const v = allVertices[idx];
              positions.push(v.x, v.y, v.z);
              colors.push(v.r, v.g, v.b);
            }
          }
        }
      }
    }

    // Create BufferGeometry
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    );
    geometry.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(colors, 3)
    );

    // Compute normals for proper lighting
    geometry.computeVertexNormals();

    // Create material that uses vertex colors
    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.7,
      metalness: 0.1,
      side: THREE.DoubleSide, // Render both sides in case of winding issues
    });

    // Create mesh and add to group
    const mesh = new THREE.Mesh(geometry, material);
    const group = new THREE.Group();
    group.add(mesh);

    return group;
  }
}
