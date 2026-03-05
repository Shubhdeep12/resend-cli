# typed: false
# frozen_string_literal: true

class ResendCli < Formula
  desc "CLI for Resend (resend.com)"
  homepage "https://github.com/Shubhdeep12/resend-cli"
  url "https://registry.npmjs.org/@shubhdeep12/resend-cli/-/resend-cli-0.4.13.tgz"
  sha256 "10bbe96c4071887518a85d13f8412f23ed2483e9f1fca717081a44a3dc396ff4"
  license "MIT"

  depends_on "node"

  def install
    (buildpath/"package").cd do
      system "npm", "install", *Language::Node.std_npm_args(libexec)
    end
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    assert_match "resend", shell_output("#{bin}/resend --help")
  end
end
